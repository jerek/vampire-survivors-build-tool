/**
 * Functions related to Vampire Survivors weapons and passive items.
 */
VST.VS.Item = new function () {
    const self = this;
    const DOM = VST.DOM;
    const Img = VST.VS.Img;
    const Passive = VST.VS.Passive;
    const Util = VST.Util
    const VS = VST.VS;
    const Weapon = VST.VS.Weapon;

    // *********************** //
    // ***** DEFINITIONS ***** //
    // *********************** //

    /** @typedef {string} ItemDisplayMode What style of display a rendered item should be. */

    // ********************* //
    // ***** VARIABLES ***** //
    // ********************* //

    /** @type {Object} Private object-scope variables. */
    const my = {
        /** @type {Object<PassiveId, Array<WeaponId>>} A map of passive IDs to weapons that they can evolve into. */
        passiveEvolutions: undefined,

        /** @type {Object<WeaponId, WeaponId>} A map of weapon IDs to weapons that they can evolve into. */
        weaponEvolutions: undefined,
    };

    // ********************* //
    // ***** CONSTANTS ***** //
    // ********************* //

    // ------ //
    // PUBLIC //
    // ------ //

    /** @type {ItemDisplayMode} The default. Just the item icon. */
    this.DISPLAY_MODE_DEFAULT = 'default';
    /** @type {ItemDisplayMode} Has a frame around the item icon. */
    this.DISPLAY_MODE_FRAME = 'frame';
    /** @type {ItemDisplayMode} Has semi-transparent frame behind the icon. */
    this.DISPLAY_MODE_EQUIPPED = 'equipped';

    /** @type {number} The scale used when displaying selected items. */
    this.SCALE_SELECTED = 2.66666;
    /** @type {number} The scale used when displaying items inside tooltips. */
    this.SCALE_TOOLTIP = 1.5;

    // ------- //
    // PRIVATE //
    // ------- //

    /** @type {number} The pixel size of an item icon at a scale of 1. */
    const BASE_ICON_SIZE = 16;

    /** @type {number} The standard scaling size of item images. */
    const IMAGE_SCALE = 2;

    // ********************* //
    // ***** FUNCTIONS ***** //
    // ********************* //

    // ------ //
    // PUBLIC //
    // ------ //

    /**
     * Add any relevant item-specific tooltip content to the given item tooltip.
     *
     * @param {HTMLDivElement}         tooltip
     * @param {PassiveData|WeaponData} item
     */
    this.addTooltipContent = function (tooltip, item) {
        //     //
        // DLC //
        //     //

        VS.DLC.addTooltipContent(tooltip, item.dlc);

        //            //
        // EVOLUTIONS //
        //            //

        // Assemble a list of all evolutions that this item is relevant to.
        let evolutions = [];
        if (item.reqWeapons || item.reqPassives) {
            evolutions.push(item);
        }
        if (item.type === VS.TYPE_WEAPON) {
            let weaponEvolution = Weapon.getEvolution(item.id);
            if (weaponEvolution) {
                evolutions.push(weaponEvolution);
            }
        } else if (item.type === VS.TYPE_PASSIVE) {
            let passiveEvolutions = Passive.getEvolutions(item.id);
            if (passiveEvolutions) {
                passiveEvolutions.forEach(passiveEvolution => evolutions.push(passiveEvolution));
            }
        }

        // If any evolutions were found, display them.
        if (evolutions.length) {
            let evolutionSection = DOM.ce('div', {className: 'vst-tooltip-items'});

            evolutions.forEach(evolution => {
                let evolutionDiv = DOM.ce('div', {className: 'vst-tooltip-items-row'});

                // Assemble a list of the entities that lead to this evolution.
                let evoItems = [];
                (evolution.reqWeapons  || []).forEach(weaponId  => evoItems.push(Weapon.get(weaponId)));
                (evolution.reqPassives || []).forEach(passiveId => evoItems.push(Passive.get(passiveId)));

                // Display the entities that lead to this evolution.
                let renderOptions = {
                    scale: self.SCALE_TOOLTIP,
                    noTooltip: true,
                };
                evoItems.forEach((evoItem, index) => {
                    if (index !== 0) {
                        evolutionDiv.appendChild(DOM.ct(' + '));
                    }

                    let itemIcon = self.render(evoItem.type, evoItem, renderOptions);
                    if (evoItem.id === item.id) {
                        itemIcon.dataset.highlight = 'true';
                    }
                    evolutionDiv.appendChild(itemIcon);
                });

                // Display the resulting evolution.
                evolutionDiv.appendChild(DOM.ct(' = '));
                let itemIcon = self.render(evolution.type, evolution, renderOptions);
                if (evolution.id === item.id) {
                    itemIcon.dataset.highlight = 'true';
                }
                evolutionDiv.appendChild(itemIcon);

                evolutionSection.appendChild(evolutionDiv);
            });

            tooltip.appendChild(evolutionSection);
        }
    };

    /**
     * Returns an ID map of passives to the weapons that they can evolve into.
     *
     * @return {Object<PassiveId, Array<WeaponId>>}
     */
    this.getPassiveEvolutionMap = () => my.passiveEvolutions;

    /**
     * Returns an ID map of weapons to the weapons that they can evolve into.
     *
     * @return {Object<WeaponId, WeaponId>}
     */
    this.getWeaponEvolutionMap = () => my.weaponEvolutions;

    /**
     * Returns elements created to display an item image.
     *
     * @param {VsType}                 type                    This is required because the item entity is optional.
     * @param {WeaponData|PassiveData} [item]                  When omitted prints an empty item entity element.
     * @param {Object}                 [options]
     * @param {function}               [options.callback]      A function executed after the image is loaded.
     * @param {ItemDisplayMode}        [options.mode]          What style of display this character box should be.
     * @param {boolean}                [options.noTooltip]     Whether to prevent attaching a tooltip to this entity.
     * @param {number}                 [options.scale=2]       The 1-base scale at which images should be displayed.
     * @param {string}                 [options.tagName="div"] The tag name to use for the element.
     * @return {HTMLSpanElement|HTMLElement}
     */
    this.render = function (type, item, options) {
        options = options || {};

        let scale = options.scale || IMAGE_SCALE;
        let mode = options.mode || self.DISPLAY_MODE_DEFAULT;

        let entity = VS.createEntityElements(type, item, options.tagName, mode || self.DISPLAY_MODE_DEFAULT);

        let size = BASE_ICON_SIZE * scale;
        let style = {
            height: `${size}px`,
            width: `${size}px`,
        };
        Util.copyProperties(entity.content.style, style);
        if (mode === self.DISPLAY_MODE_FRAME) {
            entity.content.style.padding = `${size * 0.25}px`;
        }

        if (item) {
            let setImagePos = image => {
                image.style.top = 'calc(50% - ' + parseInt(image.style.height) / 2 + 'px' + ')';
                image.style.left = 'calc(50% - ' + parseInt(image.style.width) / 2 + 'px' + ')';
                if (options.callback) {
                    options.callback();
                }
            };
            let image = Img.createImage(Img.ITEMS, item.frameName, scale, setImagePos);
            Util.copyProperties(image.style, style);
            setImagePos(image);
            entity.content.appendChild(image);

            if (!options.noTooltip) {
                entity.wrapper.appendChild(VS.createTooltip(item));
            }
        }

        return entity.wrapper;
    };

    // ------- //
    // PRIVATE //
    // ------- //

    /**
     * Generates evolution data lookups.
     */
    function initEvolutionData() {
        my.weaponEvolutions = {};
        my.passiveEvolutions = {};

        Weapon.getIds().forEach(weaponId => {
            let weapon = Weapon.get(weaponId);
            (weapon.reqWeapons || []).forEach(requiredWeaponId => my.weaponEvolutions[requiredWeaponId] = weaponId);
            (weapon.reqPassives || []).forEach(requiredPassiveId => {
                my.passiveEvolutions[requiredPassiveId] = my.passiveEvolutions[requiredPassiveId] || [];
                my.passiveEvolutions[requiredPassiveId].push(weaponId);
            });
        });

        Object.freeze(my.weaponEvolutions);
        Object.freeze(my.passiveEvolutions);
    }

    // ************************** //
    // ***** INITIALIZATION ***** //
    // ************************** //

    VST.registerInitCallback(initEvolutionData);
};
