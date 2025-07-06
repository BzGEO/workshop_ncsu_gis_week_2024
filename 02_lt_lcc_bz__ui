// Display LandTrendr-based land cover change outputs + Landsat imagery for Belize in an app-ready user interface (UI)
// Questions? Email me: eac0021@uah.edu or emil.cherrington@nasa.gov
// App: https://bzgeo.users.earthengine.app/view/bz-forest-cover-landsat
// last updated: 22.11.2024

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var a = require('users/bzgeo/examples:_ancillary/mes');
var b = require('users/servirbz/packages:img_list_landsat_sma_fc__bz');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var img_raw = b.img_raw;
var img_sma = b.img_sma;
var img_for = b.img_for2;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// PART 1: SET UP LEFT AND RIGHT PANEL WINDOWS
// CREATE LEFT 7 RIGHT MAPS
var leftMap = ui.Map();
leftMap.setOptions('TERRAIN');
leftMap.setControlVisibility(true);
var rightMap = ui.Map();
rightMap.setOptions('TERRAIN');
rightMap.setControlVisibility(true);

//
var leftSelector = addLayerSelector(leftMap, 0, 'top-left');
function addLayerSelector(mapToChange, defaultValue, position) {
  var label = ui.Label('Choose year to visualize');
  function updateMap(selection) {
    mapToChange.layers().set(0, ui.Map.Layer(img_raw[selection].visualize(b.viz_543),{},"L0_Landsat_imagery", 0));
    mapToChange.layers().set(1, ui.Map.Layer(img_sma[selection].visualize({}),{},"L1_Landsat_SMA", 0));
    mapToChange.layers().set(2, ui.Map.Layer(img_for[selection],{},"L2_Forest_cover", 1));
    mapToChange.layers().set(3, ui.Map.Layer(b.lt_030m.clip(a.roi_bz),b.pal_lt,"Land Cover Change: 1984-2024 (LandTrendr)", 0));
    mapToChange.layers().set(4, ui.Map.Layer(a.pa_bz_ln2,{palette: "yellow"},"Prot. areas", 1));
    mapToChange.layers().set(5, ui.Map.Layer(a.bnds_intl_ln2,{palette: "white"},"Int'l boundaries", 1));
    }
var select = ui.Select({items: Object.keys(img_raw), onChange: updateMap});
  select.setValue(Object.keys(img_raw)[defaultValue], true);
var controlPanel = ui.Panel({widgets: [label, select], style: {position: position}});
  mapToChange.add(controlPanel);
}

var rightSelector = addLayerSelector2(rightMap, 40, 'top-right');
function addLayerSelector2(mapToChange, defaultValue, position) {
  var label = ui.Label('Choose year to visualize');
  function updateMap(selection) {
    mapToChange.layers().set(0, ui.Map.Layer(img_raw[selection].visualize(b.viz_543),{},"L0_Landsat_imagery", 0));
    mapToChange.layers().set(1, ui.Map.Layer(img_sma[selection].visualize({}),{},"L1_Landsat_SMA", 0));
    mapToChange.layers().set(2, ui.Map.Layer(img_for[selection],{},"L2_Forest_cover", 1));
    mapToChange.layers().set(3, ui.Map.Layer(b.lt_030m.clip(a.roi_bz),b.pal_lt,"Land Cover Change: 1984-2024 (LandTrendr)", 1));
    mapToChange.layers().set(4, ui.Map.Layer(a.pa_bz_ln2,{palette: "yellow"},"Prot. areas", 1));
    mapToChange.layers().set(5, ui.Map.Layer(a.bnds_intl_ln2,{palette: "white"},"Int'l boundaries", 1));
    }
var select = ui.Select({items: Object.keys(img_raw), onChange: updateMap});
  select.setValue(Object.keys(img_raw)[defaultValue], true);
var controlPanel = ui.Panel({widgets: [label, select], style: {position: position}});
  mapToChange.add(controlPanel);
}

leftMap.setCenter(-88.7572, 17.2578, 9); // -88.7572, 17.2578, 8 | -88.4695, 17.1866, 12
rightMap.setCenter(-88.7572, 17.2578, 9);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// PART 3: Create legend for LandTrendr changes

var pal_lt = {min: 1984, max: 2024, palette: ['#9400D3', '#4B0082', '#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000']};

var legend = ui.Panel({style: {position: 'bottom-left',padding: '8px 8px'}});
var legendTitle = ui.Label({value: 'Year detected',style: {fontWeight: 'bold',fontSize: '14px',margin: '0 0 0 0',padding: '0'}}); // margin: '0 0 4px 0'
legend.add(legendTitle);
var lon = ee.Image.pixelLonLat().select('latitude');
var gradient = lon.multiply((pal_lt.max-pal_lt.min)/100.0).add(pal_lt.min);
var legendImage = gradient.visualize(pal_lt);
var panel = ui.Panel({widgets: [ui.Label(pal_lt['max'])],});
legend.add(panel);
var thumbnail = ui.Thumbnail({image: legendImage,params: {bbox:'0,0,10,100', dimensions:'10x200'},style: {padding: '1px', position: 'bottom-center'}});
legend.add(thumbnail);
var panel = ui.Panel({widgets: [ui.Label(pal_lt['min'])],});
legend.add(panel);
rightMap.add(legend);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// PART 3: INITIATE THE SPLIT PANEL
var splitPanel = ui.SplitPanel({firstPanel:leftMap, secondPanel:rightMap, wipe:true, style:{stretch: 'both'}});

var title = ui.Label("Forest cover change, 1984-2024: Belize", {stretch:'horizontal',textAlign:'center',fontWeight:'bold',fontSize:'20px', color: 'green'});
var descr = ui.Label("instructions: swipe images to compare them", {stretch:'horizontal',textAlign:'center',fontSize: '13px', color: 'mediumseagreen'});
var credits = ui.Label(
  "credits: Landsat imagery © NASA, USGS, processed with Kennedy et al. (2018)'s LandTrendr algorithm; generated by the SERVIR Science Coordination Office and last updated 07.07.2024",
{stretch:'horizontal',textAlign:'center',fontSize: '12px', color: 'gray'},
['https://code.earthengine.google.com/2a0e146c7ea53c739d150a33c9ef240d']);

var linker = ui.Map.Linker([leftMap, rightMap]);

ui.root.widgets().reset([title, descr, credits, splitPanel]);
ui.root.setLayout(ui.Panel.Layout.Flow('vertical'));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////