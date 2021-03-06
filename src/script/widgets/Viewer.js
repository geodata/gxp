/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the BSD license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/** api: (define)
 *  module = gxp
 *  class = Viewer
 *  base_link = `Ext.util.Observable <http://extjs.com/deploy/dev/docs/?class=Ext.util.Observable>`_
 */
Ext.namespace("gxp");

/** api: constructor
 *  .. class:: Viewer(config)
 *   
 *    A map viewer application framework that can be extended with plugins
 *    for layer sources and tools. Types of viewers that can be built with
 *    this framework range from simple map viewers to complex web-based GIS
 *    applications with capabilities like feature editing, styling and more.
 */
/** api: example
 *    A viewer can be added to an HTML page with a script block containing
 *    something like this for a minimal viewer with an OSM layer:
 *
 *    .. code-block:: javascript
 *
 *      var app = new gxp.Viewer({
 *          sources: {
 *              osm: {
 *                  ptype: "gxp_osmsource"
 *              }
 *          },
 *          map: {
 *              center: [0, 0],
 *              zoom: 2,
 *              layers: [{
 *                  source: "osm",
 *                  name: "mapnik"
 *              }]
 *          }
 *      });
 */
gxp.Viewer = Ext.extend(Ext.util.Observable, {
    
    /** private: property[mapPanel]
     *  ``GeoExt.MapPanel``
     */
    
    /** api: config[mapItems]
     *  ``Array(Ext.Component)``
     *  Any items to be added to the map panel. A typical item to put on a map
     *  would be a ``GeoExt.ZoomSlider``.
     */
     
    /** api: config[portalConfig]
     *  ``Object`` Configuration object for the wrapping container of the
     *  viewer. This will be an ``Ext.Panel`` if it has a ``renderTo``
     *  property, or an ``Ext.Viewport`` otherwise.
     */
    
    /** api: config[portalItems]
     *  ``Array`` Items for the portal. A MapPanel will automatically be added
     *  to the portal, unless ``portalConfig`` has ``items`` configured.
     */
    
    /** api: config[sources]
     *  ``Object`` Layer source configurations for this viewer, keyed by source
     *  id. The source id will be used to reference the layer source in the
     *  ``layers`` array of the ``map`` object.
     */

    /** api: config[map]
     *  ``Object`` Map configuration for this viewer. This object is similar
     *  to the ``GeoExt.MapPanel`` configuration, with the following
     *  exceptions:
     *
     *  * center: ``Array`` of lon (x) and lat (y) values
     *  * items: not available - use ``mapItems`` instead
     *  * tbar: not available - use :class:`gxp.Tool` plugins to populate
     *    the tbar
     *  * layers: ``Array(Object)``. Each object has a ``source`` property
     *    referencing a :class:`gxp.plugins.LayerSource`. The viewer will call
     *    the ``createLayerRecord`` of this source with the object as
     *    argument, which will result in a layer being created with the
     *    configuration provided here.
     *
     *    Valid config options for all layer sources:
     *
     *    * source: ``String`` referencing a source from ``sources``
     *    * name: ``String`` - the name from the source's ``store`` (only for
     *      sources that maintain a store)
     *    * visibility: ``Boolean`` - initial layer visibility
     *    * opacity: ``Number`` - initial layer.opacity
     *    * group: ``String`` - group for the layer when the viewer also uses a
     *      :class:`gxp.plugins.LayerTree`. Set this to "background" to make
     *      the layer a base layer
     *    * fixed: ``Boolean`` - Set to true to prevent the layer from being
     *      removed by a :class:`gxp.plugins.RemoveLayer` tool and from being
     *      dragged in a :class:`gxp.plugins.LayerTree`
     *    * selected: ``Boolean`` - Set to true to mark the layer selected
     *  * map: not available, can be configured with ``maxExtent``,
     *    ``numZoomLevels`` and ``theme``.
     *  * restrictedExtent: ``Array`` to be consumed by
     *    ``OpenLayers.Bounds.fromArray`` - the restrictedExtent of the map
     *  * maxExtent: ``Array`` to be consumed by
     *    ``OpenLayers.Bounds.fromArray`` - the maxExtent of the map
     *  * numZoomLevels: ``Number`` - the number of zoom levels if not
     *    available on the first layer
     *  * theme: ``String`` - optional theme for the ``OpenLayers.Map``, as
     *    in ``OpenLayers.Map.theme``.
     */
     
    /** api: config[defaultToolType]
     *  ``String``
     *  The default tool plugin type. Default is "gxp_tool"
     */
    defaultToolType: "gxp_tool",

    /** api: config[tools]
     *  ``Array(`` :class:`gxp.plugins.Tool` ``)``
     *  Any tools to be added to the viewer. Tools are plugins that will be
     *  plugged into this viewer's ``portal``. The ``tools`` array is usually
     *  populated with configuration objects for plugins (using a ptype),
     *  rather than instances. A default ptype can be configured with this
     *  viewer's ``defaultToolType`` option.
     */
    
    /** api: property[tools]
     *  ``Object`` Storage of tool instances for this viewer, keyed by id
     */
    tools: null,
     
    /** api: config[defaultSourceType]
     *  ``String``
     *  The default layer source plugin type.
     */
     
    /** api: property[portalItems]
     *  ``Array(Ext.Component)``
     *  Items that make up the portal.
     */
     
    /** api: property[selectedLayer]
     *  ``GeoExt.data.LayerRecord`` The currently selected layer
     */
    selectedLayer: null,
    
    /** api: config[field]
     *  :class:`gxp.form.ViewerField` Optional - set by
     *  :class:`gxp.form.ViewerField` so plugins like
     *  :class:`gxp.plugins.FeatureToField` can set the form field's value.
     */
    
    /** api: property[field]
     *  :class:`gxp.form.ViewerField` Used by plugins to access the form field.
     *  Only available if this viewer is wrapped into an
     *  :class:`Ext.form.ViewerField`.
     */
     
    /** private: method[constructor]
     *  Construct the viewer.
     */
    constructor: function(config) {

        // add any custom application events
        this.addEvents(
            /** api: event[ready]
             *  Fires when application is ready for user interaction.
             */
            "ready",
            
            /** api: event[portalready]
             *  Fires after the portal is initialized.
             */
            "portalready",

            /** api: event[beforelayerselectionchange]
             *  Fired before the selected set of layers changes.  Listeners 
             *  can return ``false`` to stop the selected layers from being 
             *  changed.
             *
             *  Listeners arguments:
             *
             *  * layerRecord - ``GeoExt.data.LayerRecord`` the record of the
             *    selected layer, or null if no layer is selected.
             */
            "beforelayerselectionchange",
            
            /** api: event[layerselectionchange]
             *  Fired when the selected set of layers changes. 
             *
             *  Listeners arguments:
             *
             *  * layerRecord - ``GeoExt.data.LayerRecord`` the record of the
             *    selected layer, or null if no layer is selected.
             */
            "layerselectionchange"
        );
        
        Ext.apply(this, {
            layerSources: {},
            portalItems: []
        });

        // private array of pending getLayerRecord requests
        this.createLayerRecordQueue = [];

        this.loadConfig(config, this.applyConfig);
        gxp.Viewer.superclass.constructor.apply(this, arguments);
        
    },
    
    /** api: method[selectLayer]
     *  :arg record: ``GeoExt.data.LayerRecord``` Layer record.  Call with no 
     *      layer record to remove layer selection.
     *  :returns: ``Boolean`` Layers were set as selected.
     *
     *  TODO: change to selectLayers (plural)
     */
    selectLayer: function(record) {
        record = record || null;
        var changed = false;
        var allow = this.fireEvent("beforelayerselectionchange", record);
        if (allow !== false) {
            changed = true;
            this.selectedLayer = record;
            this.fireEvent("layerselectionchange", record);
        }
        return changed;
    },
    
    /** api: method[loadConfig]
     *  :arg config: ``Object`` The config object passed to the constructor.
     *
     *  Subclasses that load config asynchronously can override this to load
     *  any configuration before applyConfig is called.
     */
    loadConfig: function(config) {
        this.applyConfig(config);
    },
    
    applyConfig: function(config) {
        this.initialConfig = Ext.apply({}, config);
        Ext.apply(this, this.initialConfig);
        this.load();
    },
    
    load: function() {

        // pass on any proxy config to OpenLayers
        if (this.proxy) {
            OpenLayers.ProxyHost = this.proxy;
        }
        
        this.initMapPanel();
        
        this.initTools();
        
        // initialize all layer source plugins
        var config, queue = [];
        for (var key in this.sources) {
            queue.push(this.createSourceLoader(key));
        }
        
        // create portal when dom is ready
        queue.push(function(done) {
            Ext.onReady(function() {
                this.initPortal();
                done();
            }, this);
        });
        
        gxp.util.dispatch(queue, this.activate, this);
        
    },
    
    createSourceLoader: function(key) {
        return function(done) {
            var config = this.sources[key];
            config.projection = this.initialConfig.map.projection;
            this.addLayerSource({
                id: key,
                config: config,
                callback: done,
                fallback: function() {
                    // TODO: log these issues somewhere that the app can display
                    // them after loading.
                    // console.log(arguments);
                    done();
                },
                scope: this
            });
        };
    },
    
    addLayerSource: function(options) {
        var id = options.id || Ext.id(null, "gxp-source-");
        var source;
        try {
            source = Ext.ComponentMgr.createPlugin(
                options.config, this.defaultSourceType
            );
        } catch (err) {
            throw new Error("Could not create new source plugin with ptype: " + options.config.ptype);
        }
        source.on({
            ready: function() {
                var callback = options.callback || Ext.emptyFn;
                callback.call(options.scope || this, id);
            },
            failure: function() {
                var fallback = options.fallback || Ext.emptyFn;
                delete this.layerSources[id];
                fallback.apply(options.scope || this, arguments);
            },
            scope: this
        });
        this.layerSources[id] = source;
        source.init(this);
        
        return source;
    },
    
    initMapPanel: function() {
        
        var config = Ext.apply({}, this.initialConfig.map);
        var mapConfig = {};
        
        // split initial map configuration into map and panel config
        if (this.initialConfig.map) {
            var props = "theme,controls,resolutions,projection,units,maxExtent,restrictedExtent,maxResolution,numZoomLevels".split(",");
            var prop;
            for (var i=props.length-1; i>=0; --i) {
                prop = props[i];
                if (prop in config) {
                    mapConfig[prop] = config[prop];
                    delete config[prop];
                };
            }
        }

        this.mapPanel = new GeoExt.MapPanel(Ext.applyIf({
            map: Ext.applyIf({
                theme: mapConfig.theme || null,
                controls: mapConfig.controls || [
                    new OpenLayers.Control.Navigation({zoomWheelOptions: {interval: 250}}),
                    new OpenLayers.Control.PanPanel(),
                    new OpenLayers.Control.ZoomPanel(),
                    new OpenLayers.Control.Attribution()
                ],
                maxExtent: mapConfig.maxExtent && OpenLayers.Bounds.fromArray(mapConfig.maxExtent),
                restrictedExtent: mapConfig.restrictedExtent && OpenLayers.Bounds.fromArray(mapConfig.restrictedExtent),
                numZoomLevels: mapConfig.numZoomLevels || 20
            }, mapConfig),
            center: config.center && new OpenLayers.LonLat(config.center[0], config.center[1]),
            resolutions: config.resolutions,
            layers: null,
            items: this.mapItems,
            tbar: config.tbar || {hidden: true}
        }, config));
        
        this.mapPanel.layers.on({
            "add": function(store, records) {
                // check selected layer status
                var record;
                for (var i=records.length-1; i>= 0; i--) {
                    record = records[i];
                    if (record.get("selected") === true) {
                        this.selectLayer(record);
                    }
                }
            },
            "remove": function(store, record) {
                if (record.get("selected") === true) {
                    this.selectLayer();
                }
            },
            scope: this
        });
    },
    
    initTools: function() {
        this.tools = {};
        if (this.initialConfig.tools && this.initialConfig.tools.length > 0) {
            var tool;
            for (var i=0, len=this.initialConfig.tools.length; i<len; i++) {
                try {
                    tool = Ext.ComponentMgr.createPlugin(
                        this.initialConfig.tools[i], this.defaultToolType
                    );
                } catch (err) {
                    throw new Error("Could not create tool plugin with ptype: " + this.initialConfig.tools[i].ptype);
                }
                tool.init(this);
            }
        }
    },

    initPortal: function() {
        
        var config = this.portalConfig || {};
        var Constructor = config.renderTo ? Ext.Panel : Ext.Viewport;
        
        if (this.portalItems.length === 0) {
            this.mapPanel.region = "center";
            this.portalItems.push(this.mapPanel);
        }
        
        this.portal = new Constructor(Ext.applyIf(this.portalConfig || {}, {
            layout: "fit",
            hideBorders: true,
            items: {
                layout: "border",
                deferredRender: false,
                items: this.portalItems
            }
        }));
        
        this.fireEvent("portalready");
    },
    
    activate: function() {
        // initialize tooltips
        Ext.QuickTips.init();

        // add any layers from config
        this.addLayers();
        
        // respond to any queued requests for layer records
        this.checkLayerRecordQueue();
        
        // broadcast ready state
        this.fireEvent("ready");
    },
    
    addLayers: function() {
        var mapConfig = this.initialConfig.map;
        if(mapConfig && mapConfig.layers) {
            var conf, source, record, baseRecords = [], overlayRecords = [];
            for (var i=0; i<mapConfig.layers.length; ++i) {
                conf = mapConfig.layers[i];
                source = this.layerSources[conf.source];
                // source may not have loaded properly (failure handled elsewhere)
                if (source) {
                    record = source.createLayerRecord(conf);
                    if (record) {
                        if (record.get("group") === "background") {
                            baseRecords.push(record);
                        } else {
                            overlayRecords.push(record);
                        }
                    }
                }
            }
            
            // sort background records so visible layers are first
            // this is largely a workaround for an OpenLayers Google Layer issue
            // http://trac.openlayers.org/ticket/2661
            baseRecords.sort(function(a, b) {
                return a.getLayer().visibility < b.getLayer().visibility;
            });
            
            var panel = this.mapPanel;
            var map = panel.map;
            
            var records = baseRecords.concat(overlayRecords);
            if (records.length) {
                panel.layers.add(records);

                // set map center
                if(panel.center) {
                    // zoom does not have to be defined
                    map.setCenter(panel.center, panel.zoom);
                } else if (panel.extent) {
                    map.zoomToExtent(panel.extent);
                } else {
                    map.zoomToMaxExtent();
                }
            }
            
        }        
    },
    
    /** api: method[getLayerRecordFromMap]
     *  :arg config: ``Object`` A minimal layer configuration object with source
     *      and name properties.
     *  :returns: ``GeoExt.data.LayerRecord``
     *
     *  Retrieves a layer record from the map.
     */
    getLayerRecordFromMap: function(config) {
        var record = null;
        if (this.mapPanel) {
            this.mapPanel.layers.each(function(rec) {
                if (rec.get("source") == config.source && rec.get("name") == config.name) {
                    record = rec;
                    return false;
                }
            });
        }
        return record;
    },
    
    /** api: method[createLayerRecord]
     *  :arg config: ``Object`` A minimal layer configuration object with source
     *      and name properties.
     *  :arg callback: ``Function`` A function to be called with the layer 
     *      record that corresponds to the given config.
     *  :arg scope: ``Object`` Optional scope for the callback.
     *
     *  Asyncronously retrieves a layer record given a basic layer config.  The
     *  callback will be called as soon as the desired layer source is ready.
     *  This method should only be called to retrieve layer records from sources
     *  configured before the call.
     */
    createLayerRecord: function(config, callback, scope) {
        this.createLayerRecordQueue.push({
            config: config,
            callback: callback,
            scope: scope
        });
        this.checkLayerRecordQueue();
    },
    
    /** private: method[checkLayerRecordQueue]
     *  Check through createLayerRecord requests to see if any can be satisfied.
     */
    checkLayerRecordQueue: function() {
        var request, source, record, called;
        var remaining = [];
        for (var i=0, ii=this.createLayerRecordQueue.length; i<ii; ++i) {
            called = false;
            request = this.createLayerRecordQueue[i];
            source = request.config.source;
            if (source in this.layerSources) {
                record = this.layerSources[source].createLayerRecord(request.config);
                if (record) {
                    // we call this in the next cycle to guarantee that
                    // createLayerRecord returns before callback is called
                    (function(req, rec) {
                        window.setTimeout(function() {
                            req.callback.call(req.scope, rec);                        
                        }, 0);
                    })(request, record);
                    called = true;
                }
            }
            if (!called) {
                remaining.push(request);
            }
        }
        this.createLayerRecordQueue = remaining;
    },
    
    /** api:method[getSource]
     *  :arg layerRec: ``GeoExt.data.LayerRecord`` the layer to get the
     *      source for.
     */
    getSource: function(layerRec) {
        return layerRec && this.layerSources[layerRec.get("source")];
    },

    /** private: method[getState]
     *  :returns: ``Object`` Representation of the app's current state.
     */ 
    getState: function() {

        // start with what was originally given
        var state = Ext.apply({}, this.initialConfig);
        
        // update anything that can change
        var center = this.mapPanel.map.getCenter();
        Ext.apply(state.map, {
            center: [center.lon, center.lat],
            zoom: this.mapPanel.map.zoom,
            layers: []
        });
        
        // include all layer config (and add new sources)
        this.mapPanel.layers.each(function(record){
            var layer = record.getLayer();
            if (layer.displayInLayerSwitcher) {
                var id = record.get("source");
                var source = this.layerSources[id];
                if (!source) {
                    throw new Error("Could not find source for layer '" + record.get("name") + "'");
                }
                // add layer
                state.map.layers.push(source.getConfigForRecord(record));
                if (!state.sources[id]) {
                    state.sources[id] = Ext.apply({}, source.initialConfig);
                }
            }
        }, this);
        
        return state;
    },
    
    /** api: method[destroy]
     */
    destroy: function() {
        //TODO there is probably more that needs to be destroyed
        this.mapPanel.destroy();
        this.portal && this.portal.destroy();
    }
    
});

(function() {
    // OGC "standardized rendering pixel size"
    OpenLayers.DOTS_PER_INCH = 25.4 / 0.28;
})();