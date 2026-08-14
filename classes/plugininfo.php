<?php
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

namespace tiny_bibliotech;

defined('MOODLE_INTERNAL') || die();

use editor_tiny\editor;
use editor_tiny\plugin;
use editor_tiny\plugin_with_buttons;
use editor_tiny\plugin_with_menuitems;
use editor_tiny\plugin_with_configuration;
use context;

/**
 * Tiny editor Bibliotech plugin info class.
 *
 * @package    tiny_bibliotech
 * @copyright  2026 Trevor McCready, Horizon Education Network <https://www.horizonednet.org>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class plugininfo extends plugin implements
    plugin_with_buttons,
    plugin_with_menuitems,
    plugin_with_configuration {

    /**
     * Checks if the Bibliotech plugin should be enabled for the current user/context.
     *
     * @param context $context Current context
     * @param array $options Editor options
     * @param array $fpoptions Filepicker options
     * @param editor|null $editor Editor instance
     * @return bool True if enabled, false otherwise.
     */
    public static function is_enabled(context $context, array $options, array $fpoptions, ?editor $editor = null): bool {
        if (!class_exists('\local_bibliotech\access_manager')) {
            return false;
        }
        return \local_bibliotech\access_manager::has_access();
    }

    /**
     * Get the buttons supplied by this plugin.
     *
     * @return array List of buttons
     */
    public static function get_available_buttons(): array {
        return [
            'tiny_bibliotech/bibliotech',
        ];
    }

    /**
     * Get the menu items supplied by this plugin.
     *
     * @return array List of menu items
     */
    public static function get_available_menuitems(): array {
        return [
            'tiny_bibliotech/bibliotech',
        ];
    }

    /**
     * Get plugin configuration for context.
     *
     * @param context $context Current context
     * @param array $options Editor options
     * @param array $fpoptions Filepicker options
     * @param editor|null $editor Editor instance
     * @return array Configuration map
     */
    public static function get_plugin_configuration_for_context(
        context $context,
        array $options,
        array $fpoptions,
        ?editor $editor = null
    ): array {
        $courseid = null;
        $coursecontext = $context->get_course_context(false);
        if ($coursecontext) {
            $courseid = $coursecontext->instanceid;
        }
        $deeplinkurl = \local_bibliotech\lti_manager::get_deeplink_url($courseid);
        return [
            'deeplinkUrl' => $deeplinkurl,
        ];
    }
}
