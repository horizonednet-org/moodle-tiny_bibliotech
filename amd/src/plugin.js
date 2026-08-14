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

    let activeEditor = null;
    let activeModal = null;

    var Configuration = {
        configure: function(instanceConfig) {
            return {
                toolbar: utils.addToolbarButton(instanceConfig.toolbar, 'content', buttonName),
                menu: utils.addMenubarItem(instanceConfig.menu, 'insert', buttonName)
            };
        }
    };

    function extractSingleItemData(item) {
        if (!item || typeof item !== 'object') {
            return null;
        }

        const title = item.title || item.name || item.text || 'Bibliotech Resource';
        let id = item.uuid || item.isbn || item.id || item.identifier || item.resource_id || item.lineitemresourceid || '';
        let kind = item.kind || 'book';

        const customParamsStr = item.instructorcustomparameters || (typeof item.custom === 'string' ? item.custom : '');
        const customParams = {};

        if (customParamsStr) {
            customParamsStr.split('\n').forEach(function(line) {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const k = parts[0].trim().toLowerCase();
                    const v = parts.slice(1).join('=').trim();
                    customParams[k] = v;
                }
            });
        } else if (typeof item.custom === 'object' && item.custom !== null) {
            Object.keys(item.custom).forEach(function(k) {
                customParams[k.toLowerCase()] = item.custom[k];
            });
        }

        if (!id) {
            id = customParams.uuid || customParams.isbn || customParams.id || customParams.custom_uuid || customParams.custom_isbn || customParams.custom_id || customParams.resource_id || '';
        }
        if (customParams.kind) {
            kind = customParams.kind;
        }

        const targetUrl = item.toolurl || item.url || item.securetoolurl || '';
        if (!id && targetUrl) {
            const matches = targetUrl.match(/(?:publication|book|resource|item|title|volume)\/([^\/\?#]+)/i)
                         || targetUrl.match(/[?&](?:uuid|isbn|id|custom_uuid|custom_isbn|custom_id)=([^&]+)/i);
            if (matches && matches[1]) {
                id = matches[1];
            }
        }

        if (!id && title && title !== 'Bibliotech Resource') {
            id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        }

        if (!id) {
            return null;
        }

        const uri = item.uri || ('bibliotech://publication/' + kind + '/' + id);

        return {
            id: id,
            title: title,
            kind: kind,
            uri: uri
        };
    }

    function extractAllResourcesData(data) {
        if (!data) {
            return [];
        }

        let items = [];
        if (Array.isArray(data)) {
            items = data;
        } else if (data.multiple && Array.isArray(data.multiple)) {
            items = data.multiple;
        } else if (data.items && Array.isArray(data.items)) {
            items = data.items;
        } else if (data.resources && Array.isArray(data.resources)) {
            items = data.resources;
        } else if (data.content_items && Array.isArray(data.content_items)) {
            items = data.content_items;
        } else {
            items = [data];
        }

        const results = [];
        items.forEach(function(item) {
            const res = extractSingleItemData(item);
            if (res) {
                results.push(res);
            }
        });

        return results;
    }

    function insertResources(editor, resourcesList, modal) {
        const targetEditor = editor || activeEditor || (window.tinymce ? window.tinymce.activeEditor : null);

        if (targetEditor && resourcesList && resourcesList.length > 0) {
            let htmlToInsert = '';
            resourcesList.forEach(function(resData) {
                htmlToInsert += '<p>[bibliotech id="' + resData.id + '" title="' + resData.title + '" uri="' + resData.uri + '"]</p>';
            });
            targetEditor.insertContent(htmlToInsert);
        }

        if (modal || activeModal) {
            const m = modal || activeModal;
            m.destroy();
            activeModal = null;
        }
    }

    // Global callback expected by Moodle LTI Deep Linking return (mod_lti/contentitem_return)
    window.processContentItemReturnData = function(returnData) {
        const resourcesList = extractAllResourcesData(returnData);
        insertResources(activeEditor, resourcesList, activeModal);
    };

    return new Promise(function(resolve) {
        Promise.all([
            loader.getTinyMCE(),
            utils.getPluginMetadata(component, component)
        ]).then(function(results) {
            var tinyMCE = results[0];
            var pluginMetadata = results[1];

            tinyMCE.PluginManager.add(component + '/plugin', function(editor) {
                if (editor.options && typeof editor.options.register === 'function') {
                    editor.options.register('tiny_bibliotech:deeplinkUrl', {
                        processor: 'string',
                        "default": ''
                    });
                }

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
        activeEditor = editor;

        ModalFactory.create({
            type: ModalFactory.types.DEFAULT,
            title: 'Select Bibliotech Publication',
            body: '<div class="text-center p-3"><iframe id="bibliotech_deeplink_iframe" src="' + getDeepLinkUrl(editor) + '" style="width:100%;height:500px;border:none;"></iframe></div>',
            large: true
        }).then(function(modal) {
            activeModal = modal;
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

                if (data.type === 'bibliotech_resource_selected' || data.isbn || data.id || data.uuid || data.title || data.name || data.multiple || data.items) {
                    const resourcesList = extractAllResourcesData(data);
                    if (resourcesList.length > 0) {
                        window.removeEventListener('message', handleMessage);
                        insertResources(editor, resourcesList, modal);
                    }
                }
            };

            window.addEventListener('message', handleMessage);
        });
    }

    function getDeepLinkUrl(editor) {
        if (editor && editor.options && typeof editor.options.get === 'function') {
            var url = editor.options.get('tiny_bibliotech:deeplinkUrl');
            if (url) {
                return url;
            }
        }
        var wwwroot = (window.M && window.M.cfg && window.M.cfg.wwwroot) ? window.M.cfg.wwwroot : '';
        return wwwroot + '/local/bibliotech/select_content.php';
    }
});
