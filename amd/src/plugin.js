// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Tiny Bibliotech plugin AMD module.
 *
 * @module     tiny_bibliotech/plugin
 * @copyright  2026 Trevor McCready, Horizon Education Network <https://www.horizonednet.org>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([
    'editor_tiny/loader',
    'editor_tiny/utils',
    'core/modal_factory'
], function(loader, utils, ModalFactory) {
    'use strict';

    const component = 'tiny_bibliotech';
    const buttonName = 'tiny_bibliotech/bibliotech';

    var Configuration = {
        configure: function(instanceConfig) {
            return {
                toolbar: utils.addToolbarButton(instanceConfig.toolbar, 'content', buttonName),
                menu: utils.addMenubarItem(instanceConfig.menu, 'insert', buttonName)
            };
        }
    };

    return new Promise(function(resolve) {
        Promise.all([
            loader.getTinyMCE(),
            utils.getPluginMetadata(component, component)
        ]).then(function(results) {
            var tinyMCE = results[0];
            var pluginMetadata = results[1];

            tinyMCE.PluginManager.add(component + '/plugin', function(editor) {
                editor.ui.registry.addButton(buttonName, {
                    text: 'Bibliotech',
                    icon: 'bookmark',
                    tooltip: 'Select Bibliotech Resource',
                    onAction: function() {
                        openContentSelectionModal(editor, ModalFactory);
                    }
                });

                editor.ui.registry.addMenuItem(buttonName, {
                    text: 'Bibliotech Resource',
                    icon: 'bookmark',
                    onAction: function() {
                        openContentSelectionModal(editor, ModalFactory);
                    }
                });

                return pluginMetadata;
            });

            resolve([component + '/plugin', Configuration]);
        });
    });

    function openContentSelectionModal(editor, ModalFactory) {
        ModalFactory.create({
            type: ModalFactory.types.DEFAULT,
            title: 'Select Bibliotech Publication',
            body: '<div class="text-center p-3"><iframe id="bibliotech_deeplink_iframe" src="' + getDeepLinkUrl(editor) + '" style="width:100%;height:500px;border:none;"></iframe></div>',
            large: true
        }).then(function(modal) {
            modal.show();

            const handleMessage = function(event) {
                const iframe = document.getElementById('bibliotech_deeplink_iframe');
                if (iframe && event.source !== iframe.contentWindow) {
                    return;
                }

                if (!event.data) {
                    return;
                }

                let data = event.data;
                if (typeof data === 'string') {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        return;
                    }
                }

                if (data.type === 'bibliotech_resource_selected' || data.isbn || data.id) {
                    const id = data.isbn || data.id;
                    if (!id) {
                        return;
                    }
                    const title = data.title || 'Bibliotech Resource';
                    const uri = data.uri || ('bibliotech://publication/book/' + id);

                    const shortcode = '[bibliotech id="' + id + '" title="' + title + '" uri="' + uri + '"]';
                    editor.insertContent(shortcode);

                    window.removeEventListener('message', handleMessage);
                    modal.destroy();
                }
            };

            window.addEventListener('message', handleMessage);
        });
    }

    function getDeepLinkUrl(editor) {
        if (editor && editor.options) {
            var url = editor.options.get('tiny_bibliotech:deeplinkUrl');
            if (url) {
                return url;
            }
        }
        if (window.M && window.M.cfg && window.M.cfg.wwwroot) {
            return window.M.cfg.wwwroot + '/mod/lti/contentitem.php';
        }
        return '/mod/lti/contentitem.php';
    }
});
