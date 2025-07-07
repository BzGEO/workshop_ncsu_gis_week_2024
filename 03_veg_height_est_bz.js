/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var roi_box = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-89.29568282324368, 18.548472324612046],
          [-89.29568282324368, 15.84098503519571],
          [-88.03225508886868, 15.84098503519571],
          [-88.03225508886868, 18.548472324612046]]], null, false),
    roi_bz = ee.FeatureCollection("projects/bz-sdg/aoi/bz_bounds_swbd"),
    chm_fab = ee.Image("projects/bz-sdg/x_tmp/mod_agb_gedi/mes_chm_fabdem_30m"),
    dsm_cop = ee.Image("projects/bz-sdg/x_tmp/mod_agb_gedi/mes_dsm_cop_30m"),
    dtm_fab = ee.Image("projects/bz-sdg/x_tmp/mod_agb_gedi/mes_dtm_fabdem_30m"),
    slp_cop = ee.Image("projects/bz-sdg/x_tmp/mod_agb_gedi/mes_slp_cop_30m"),
    slp_fab = ee.Image("projects/bz-sdg/x_tmp/mod_agb_gedi/mes_slp_fabdem_30m"),
    gedi_chm_rh95 = ee.Image("projects/bz-sdg/x_tmp/mod_agb_gedi/mes_gedi_02a_chm_rh95_2019_2023_l1"),
    gedi_chm_rh98 = ee.Image("projects/bz-sdg/x_tmp/mod_agb_gedi/mes_gedi_02a_chm_rh98_2019_2023_l1"),
    gedi_agb = ee.Image("projects/bz-sdg/x_tmp/mod_agb_gedi/mes_agb_gedi_025m");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Upscale GEDI L2A data to estimate vegetation heights
// Based on work / code from Ujaval Gandhi (copyright 2024), and licensed under the terms of the MIT license (see: https://opensource.org/licenses/MIT).
// See: https://spatialthoughts.com/2024/02/07/agb-regression-gee/
// Last updated: 22.11.2024

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Load LandTrendr-derived annual Landsat reflectance mosaics for Belize
var a = require('users/servirbz/packages:img_list_landsat_sma_fc__bz');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var stk = a.img_raw[2022].reproject('EPSG:32616', null, 100).clip(roi_box);
stk =      stk.addBands(chm_fab).addBands(dtm_fab).addBands(dsm_cop)
              .addBands(slp_cop.select(['slope'],['slope_cop']))
              .addBands(slp_fab.select(['slope'],['slope_fab']))
              .addBands(gedi_chm_rh95.select(['rh95'],['rh_095']))
              .addBands(gedi_chm_rh98.select(['rh98'],['rh_098']))
              .addBands(gedi_agb.select(['agbd'],['agb']))
              .resample('bilinear')
              .reduceResolution({reducer: ee.Reducer.mean(),maxPixels: 1024}).reproject('EPSG:32616', null, 100)
              .clip(roi_box).clip(roi_bz);

stk = stk.updateMask(stk.mask().gt(0));
print(stk);

//stk = stk.select(['B1','B2','B3','B4','B5','B7','CHM','DTM','DSM','slope_cop','slope_fab','rh_095','rh_098','agb']);
stk = stk.select(['B2','B3','B4','B7','CHM','DTM','slope_cop','rh_095','rh_098','agb']);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var x = 'rh_098';
var y = x + '_predicted';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//var predictors = stk.select(ee.List.sequence(0,10,1)).bandNames(); // Extract *ALL bands* as predictors
var predictors = stk.select(ee.List.sequence(0,6,1)).bandNames(); // Extract *first 7 bands* as predictors

var predicted = stk.select([x]).bandNames().get(0);
print('predictors', predictors);
print('predicted', predicted);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var predictorImage = stk.select(predictors);
var predictedImage = stk.select([predicted]);
var numSamples = 1000;

var training = stk.addBands(predictedImage.mask().toInt().rename('class'))
  .stratifiedSample({numPoints: numSamples, classBand: 'class', region: roi_box,
    scale: 100, classValues: [0, 1], classPoints: [0, numSamples], dropNulls: true, tileScale: 16}).randomColumn();

var trainingGcp = training.filter(ee.Filter.lt('random', 0.7));
var validationGcp = training.filter(ee.Filter.gte('random', 0.7));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Train a classifier
var classifier = ee.Classifier.smileCart().setOutputMode('REGRESSION')
                .train({features: trainingGcp, classProperty: x, inputProperties: predictors});

// Train a regression model

var model = ee.Classifier.smileCart().setOutputMode('REGRESSION')
                .train({features: training, classProperty: predicted, inputProperties: predictors});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Get model's predictions for training samples
var predicted = training.classify({classifier: model, outputName: y});

// Calculate RMSE
var calculateRmse = function(input) {
    var observed = ee.Array(input.aggregate_array(x));
    var predicted = ee.Array(input.aggregate_array(y));
    var rmse = observed.subtract(predicted).pow(2).reduce('mean', [0]).sqrt().get([0]);
    return rmse;};
print('RMSE', calculateRmse(predicted));

// Create a plot of observed vs. predicted values
print(ui.Chart.feature.byFeature({features: predicted.select([x, y]), xProperty: x,yProperties: [y]})
    .setChartType('ScatterChart').setOptions({
    title: 'Canopy height (m)', dataOpacity: 0.8, hAxis: {'title': 'Observed'}, vAxis: {'title': 'Predicted'},
    legend: {position: 'right'}, series: {0: {visibleInLegend: false, color: '#525252', pointSize: 3, pointShape: 'triangle',},},
    trendlines: {0: {type:'linear',color:'black',lineWidth:1,pointSize:0,labelInLegend: 'Linear Fit', visibleInLegend: true,showR2: true}},
    chartArea: {left: 100, bottom:100, width:'50%'},}));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Upscale the model to all of the data
var predictedImage = stk.classify({classifier: model, outputName: x}).reproject('EPSG:32616', null, 100);

Map.addLayer(predictedImage, {min: 0,  max: 40,  palette: ['#edf8fb','#b2e2e2','#66c2a4','#2ca25f','#006d2c']}, y, 1);
Map.setCenter(-88.753, 17.249, 10);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Feature Importance
var importance = ee.Dictionary(classifier.explain().get('importance')); // Calculate variable importance
var sum = importance.values().reduce(ee.Reducer.sum()); // Calculate relative importance
var relativeImportance = importance.map(function(key, val) {return (ee.Number(val).multiply(100)).divide(sum)});
//print(relativeImportance);

var importanceFc = ee.FeatureCollection([ee.Feature(null, relativeImportance)]); // Create a FeatureCollection so we can chart it
print(ui.Chart.feature.byProperty({features: importanceFc})
              .setOptions({title: 'Feature Importance', vAxis: {title: 'Importance'}, hAxis: {title: 'Feature'}}));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Hyperparameter Tuning
var test = stk.sampleRegions({collection: validationGcp, properties: [x], scale: 100, tileScale: 16});

// Tune the numberOfTrees parameter.
var numTreesList = ee.List.sequence(10, 150, 10);

var accuracies = numTreesList.map(function(numTrees) {
  var classifier1 = ee.Classifier.smileRandomForest(numTrees).setOutputMode('REGRESSION')
      .train({features: trainingGcp, classProperty: x, inputProperties: stk.bandNames()});
  // Here we are classifying a table instead of an image. Classifiers work on both images and tables
  return validationGcp.classify(classifier1).errorMatrix(x, 'classification').accuracy()});

var chart2 = ui.Chart.array.values({array: ee.Array(accuracies), axis: 0, xLabels: numTreesList})
  .setOptions({title: 'Hyperparameter Tuning for the numberOfTrees Parameters', vAxis: {title: 'Validation Accuracy'},
  hAxis: {title: 'Number of Tress', gridlines: {count: 15}}});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Export the image with predicted values
// ****************************************************

Export.image.toAsset({image: predictedImage.clip(roi_box), description: 'Predicted_Image_Export',
  assetId: 'bz_gedi_chm_' + x + '_est_100m', region: roi_box, scale: 100, maxPixels: 1e10});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////