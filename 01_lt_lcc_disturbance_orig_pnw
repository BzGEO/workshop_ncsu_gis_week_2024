/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var aoi = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-122.85852704228836, 43.79675214190582],
          [-122.85852704228836, 43.72037786243767],
          [-122.74248395146805, 43.72037786243767],
          [-122.74248395146805, 43.79675214190582]]], null, false);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//######################################################################################################## 
//#                                                                                                    #\\
//#                           LANDTRENDR GREATEST DISTURBANCE MAPPING                                  #\\
//#                                                                                                    #\\
//########################################################################################################

// last updated: 2024-11-22 | orig. date: 2018-10-07
// modified by Emil Cherrington | eac0021@uah.edu / emil.cherrington@nasa.gov
// author: Justin Braaten | jstnbraaten@gmail.com
//         Zhiqiang Yang  | zhiqiang.yang@oregonstate.edu
//         Robert Kennedy | rkennedy@coas.oregonstate.edu
// parameter definitions: https://emapr.github.io/LT-GEE/api.html#getchangemap
// website: https://github.com/eMapR/LT-GEE | notes: 
//   - you must add the LT-GEE API to your GEE account to run this script. 
//     Visit this URL to add it: https://code.earthengine.google.com/?accept_repo=users/emaprlab/public
//   - use this app to help parameterize: https://emaprlab.users.earthengine.app/view/lt-gee-change-mapper

//##########################################################################################
// START INPUTS
//##########################################################################################

// define collection parameters
var startYear = 2000;
var endYear = 2020;
var startDay = '06-20';
var endDay = '09-01';
var index = 'NBR';
var maskThese = ['cloud', 'shadow', 'snow', 'water'];

// define landtrendr parameters
var runParams = { 
  maxSegments:            6,
  spikeThreshold:         0.9,
  vertexCountOvershoot:   3,
  preventOneYearRecovery: true,
  recoveryThreshold:      0.25,
  pvalThreshold:          0.05,
  bestModelProportion:    0.75,
  minObservationsNeeded:  6
};

// define change parameters
var changeParams = {
  delta:  'loss',
  sort:   'greatest',
  year:   {checked:true, start:2000, end:2020},
  mag:    {checked:true, value:200,  operator:'>'},
  dur:    {checked:true, value:4,    operator:'<'},
  preval: {checked:true, value:300,  operator:'>'},
  mmu:    {checked:true, value:11},
};

//##########################################################################################
// END INPUTS
//##########################################################################################

// load the LandTrendr.js module
var ltgee = require('users/emaprlab/public:Modules/LandTrendr.js'); 

// add index to changeParams object
changeParams.index = index;

// run landtrendr
var lt = ltgee.runLT(startYear, endYear, startDay, endDay, aoi, index, [], runParams, maskThese);

// get the change map layers
var changeImg = ltgee.getChangeMap(lt, changeParams);

// set visualization dictionaries
var palette = ['#9400D3', '#4B0082', '#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'];
var yodVizParms = {min: startYear, max: endYear, palette: palette};

var magVizParms = {min: 200, max: 800,  palette: palette};

// display the change attribute map - note that there are other layers - print changeImg to console to see all
Map.centerObject(aoi, 11);
Map.addLayer(changeImg.select(['mag']), magVizParms, 'Magnitude of Change');
Map.addLayer(changeImg.select(['yod']), yodVizParms, 'Year of Detection');


// Export change data to google drive
var exportImg = changeImg.clip(aoi).unmask(0).short();

Export.image.toDrive({image: exportImg, description: 'lt-gee_disturbance_map', 
  folder: 'lt-gee_disturbance_map_test', fileNamePrefix: 'lt-gee_disturbance_map', 
  region: aoi, scale: 30, crs: 'EPSG:5070', maxPixels: 1e13});