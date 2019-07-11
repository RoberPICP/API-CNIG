/**
 * @module M/plugin/Attributions
 */
import 'assets/css/attributions';
import AttributionsImpl from 'impl/attributions';
import AttributionsControl from './attributionscontrol';
import { intersect } from './filter';

const MODES = {
  mapAttributions: 1, // Map attributions from vector layer
  layerAttributions: 2, // Attributions layer from its capabilities wms service
  mixed: 3, // Mixed mode ( 1 + 2)
};

/**
 * @typedef {AttributionsOptions}
 *
 * The mode according to which the plugin will consult the attributions.
 * @param {mode}
 * @type {number}
 *
 *
 * @param {url}
 * @type {URLLike}
 */

/**
 * Class of attributions plugin
 * @param {object}
 * @classdesc
 */
export default class Attributions extends M.Plugin {
  /**
   * @constructor
   * @extends {M.Plugin}
   * @param {AttributionsOptions} options
   * @api
   */
  constructor(options = {}) {
    super();

    if (M.utils.isNullOrEmpty(options.mode) || !Object.values(MODES).includes(options.mode)) {
      throw new Error('Options mode is bad setted. Tip: {mode: 1 | 2 | 3}, ...');
    }

    if (options.mode === MODES.mapAttributions && !M.utils.isNullOrEmpty(options.url)) {
      if (M.utils.isNullOrEmpty(options.type)) {
        throw new Error('Missing "type" options. When "url" option is setted the plugin needs "type" option. Values = geojson | kml | topojson');
      }
    }

    if (options.mode === MODES.mapAttributions && !M.utils.isNullOrEmpty(options.layerName)) {
      if (M.utils.isNullOrEmpty(options.type)) {
        throw new Error('Missing "layerName" options. When "url" option is setted the plugin needs "layerName" option.');
      }
    }

    /**
     * Facade of the map
     *
     * @private
     * @type {M.Map}
     */
    this.map_ = null;

    /**
     * Array of controls
     *
     * @private
     * @type {Array<M.Control>}
     */
    this.controls_ = [];

    /**
     * Mode of the plugin
     *
     * @private
     * @type {number}
     */
    this.mode_ = options.mode;

    /**
     * Vectorial service attributions
     *
     * @private
     * @type {URLLike}
     */
    this.url_ = options.url || 'https://componentes.ign.es/NucleoVisualizador/vectorial_examples/atribucionPNOA.kml';

    /**
     * Type of the data url
     *
     * @private
     * @type {string}
     */
    this.type_ = options.type || 'kml';

    /**
     * The name of the vector layer hat contains the attribution information.
     *
     * @private
     * @type {string}
     */
    this.layerName_ = options.layerName || 'attributions';

    /**
     * Layer of Mapea with attributions
     *
     * @private
     * @type {M.layer.GeoJSON | M.layer.KML}
     */
    this.layer_ = options.layer;

    /**
     * Zoom from which attributions are displayed
     *
     * @private
     * @type {number}
     */
    this.scale_ = options.scale || 10000;

    /**
     * Parameter of the features of the layer that contains the information of the attributions.
     *
     * @private
     * @type {string}
     */
    this.attributionParam_ = options.attributionParam || 'atribucion';

    /**
     * Parameter of the features of the layer that contains the information of the URL.
     * @private
     * @type {URLLike}
     */
    this.urlParam_ = options.urlParam || 'url';

    /**
     * Minimum width of the view control
     * @private
     * @type {string}
     */
    this.minWidth_ = options.minWidth || '100px';

    /**
     * Minimum width of the view control
     * @private
     * @type {string}
     */
    this.maxWidth_ = options.maxWidth || '200px';

    /**
     * Position of the view control
     * @private
     * @type {string}
     */
    this.position_ = options.position || 'BL';

    /**
     * Default text attribution
     *
     * @private
     * @type {string}
     */
    this.defaultAttribution_ = options.defaultAttribution;

    /**
     * Default url attribution
     *
     * @private
     * @type {string}
     */
    this.defaultURL_ = options.defaultURL;

    /**
     * Tooltip of the UI Plugin
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || 'Reconocimientos';

    window.addEventListener('resize', e => this.setCollapsiblePanel(e));
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {M.Map} map the map to add the plugin
   * @api stable
   */
  addTo(map) {
    this.map_ = map;
    this.impl_ = new AttributionsImpl(map);
    this.control_ = new AttributionsControl(this.position_, this.closePanel);
    this.controls_.push(this.control_);

    this.panel_ = new M.ui.Panel('Attributions', {
      collapsible: window.innerWidth < 769,
      position: M.ui.position[this.position_],
      className: 'm-panel-attributions',
      collapsedButtonClass: 'g-cartografia-info',
      tooltip: this.tooltip_,
    });

    this.panel_.addControls(this.control_);

    this.map_.addPanels(this.panel_);
    this.initMode();

    this.onMoveEnd(() => {
      this.changeAttributions();
    });
  }

  /**
   * @public
   * @function
   */
  initMode() {
    if (this.mode_ === MODES.mapAttributions) {
      if (!(this.layer_ instanceof M.layer.Vector)) {
        const optionsLayer = {
          name: this.layerName_,
          url: this.url_,
        };

        if (this.type_ === 'geojson') {
          this.layer_ = new M.layer.GeoJSON(optionsLayer);
        } else if (this.type_ === 'kml') {
          this.layer_ = new M.layer.KML(optionsLayer);
        } else if (this.type === 'topojson') {
          // TODO: Implement in Mapea M.layer.TopoJSON
        }
      }

      if (this.map_.getLayers({ name: this.layer_ }).length < 1) {
        this.map_.addLayers(this.layer_);
        this.layer_.displayInLayerSwitcher = false;
        this.layer_.setVisible(false);
      }
    }
  }


  /**
   * This method shows the layer attributions
   *
   * @function
   * @public
   */
  changeAttributions() {
    this.clearContent();
    if (this.map_.getScale() <= this.scale_) {
      this.setVisible(true);
      let mapAttributions = [];
      if (this.mode_ === MODES.mapAttributions) {
        mapAttributions = this.getMapAttributions();
      } else if (this.mode_ === MODES.layerAttributions) {
        // TODO:
      } else if (this.mode === MODES.mixed) {
        // TODO:
      }

      this.addContent(mapAttributions);
    } else if (typeof this.defaultAttribution_ !== 'string') {
      this.setVisible(false);
    } else {
      this.addContent([{
        attribution: this.defaultAttribution_,
        url: this.defaultURL_,
      }]);
    }
  }

  /**
   * This method adds the text content to the view attribution
   *
   * @function
   * @public
   */
  addContent(attributions) {
    const html = this.control_.getElement();
    const links = attributions.map((attrOpt, index, arr) => {
      const link = document.createElement('a');
      link.target = '_blank';
      link.href = attrOpt.url;
      link.innerText = attrOpt.attribution;
      link.innerText += arr.length - 1 === index ? '' : ',';
      return link;
    });
    const div = document.createElement('div');
    links.forEach((link) => {
      div.append(link);
    });
    html.append(div);
  }

  /**
   * This method adds the text content to the view attribution
   *
   * @function
   * @public
   */
  clearContent() {
    const html = this.control_.getElement();
    html.querySelectorAll('div').forEach(child => html.removeChild(child));
  }

  /**
   * This method toggle de visibility of the view attribution
   */
  setVisible(visibility) {
    const html = this.control_.getElement();
    html.style.display = visibility === false ? 'none' : '';
  }

  /**
   * @function
   * @public
   */
  getMapAttributions() {
    this.updateBBoxFeature();
    const featuresAttributions = this.layer_.getFeatures();
    const interFilter = intersect(this.bboxFeature_);
    const filteredFeatures = interFilter.execute(featuresAttributions);
    return filteredFeatures.map((feature) => {
      return {
        attribution: feature.getAttribute(this.attributionParam_),
        url: feature.getAttribute(this.urlParam_) || this.defaultURL_,
      };
    }).filter((element, index, array) => // remove repeat elements
      array.map(e => e.attribution).indexOf(element.attribution) === index);
  }

  /**
   * @function
   * @public
   */
  getLayerAttributions() {
    // TODO:
  }

  /**
   * @function
   * @public
   */
  closePanel() {
    this.getPanel().collapse();
  }

  /**
   * @function
   * @public
   */
  changeContentAttribution(content) {
    this.control_.changeContent(content);
  }

  /**
   * @function
   * @public
   */
  updateBBoxFeature() {
    const { x, y } = this.map_.getBbox();
    this.bboxFeature_ = new M.Feature('bbox_feature', {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [x.min, y.min],
            [x.min, y.max],
            [x.max, y.max],
            [x.max, y.min],
            [x.min, y.min],
          ],
        ],
      },
    });
  }

  /**
   * @function
   * @public
   */
  setCollapsiblePanel(e) {
    if (this.getPanel() && this.getPanel().getTemplatePanel()) {
      if (e.target.innerWidth < 769) {
        this.getPanel().getTemplatePanel().classList.remove('no-collapsible');
        this.closePanel();
      } else {
        this.getPanel().getTemplatePanel().classList.add('no-collapsible');
        this.getPanel().getTemplatePanel().classList.remove('collapsed');
      }
    }
  }
  /**
   * @function
   * @public
   */
  onMoveEnd(callback) {
    this.impl_.registerEvent('moveend', e => callback(e));
  }

  /**
   * @function
   * @public
   */
  getPanel() {
    return this.panel_;
  }

  /**
   * Name of the plugin
   *
   * @getter
   * @function
   */
  get name() {
    return 'Attributions';
  }
}
