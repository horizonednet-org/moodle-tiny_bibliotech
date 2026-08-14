# TinyMCE Bibliotech Editor Plugin (`tiny_bibliotech`)

**Author**: Trevor McCready, Horizon Education Network (<https://www.horizonednet.org>)  
**License**: GNU General Public License v3 or later  
**Software Dependency**: Bibliotech (<https://bibliotechsl.com>)

---

## Overview

`tiny_bibliotech` is a TinyMCE 6 editor subplugin for Moodle 4.5+ that adds a **Bibliotech** toolbar button to Moodle's text editor. It connects to the **Bibliotech** digital library platform (<https://bibliotechsl.com>).

### Key Functionality:
- **Editor Button**: Adds a Bibliotech icon button to the TinyMCE toolbar (enabled only for authorized Bibliotech subscribers).
- **Content Selection Modal**: Launches an LTI Deep Linking modal dialog allowing teachers to search and select theological publications.
- **Shortcode Insertion**: Inserts a clean `[bibliotech ...]` shortcode directly into the editor for seamless rendering by `filter_bibliotech`.

---

## Prerequisites

This plugin requires both of the following plugins to be installed first:
1. **`local_bibliotech`** (`local/bibliotech`)
2. **`filter_bibliotech`** (`filter/bibliotech`)

---

## Installation Instructions

1. **Copy/Extract Plugin**:
   Extract or clone this directory into Moodle's TinyMCE subplugins directory:
   ```bash
   moodle/lib/editor/tiny/plugins/bibliotech
   ```
2. **Run Moodle Upgrade**:
   - Log in to your Moodle site as an Administrator.
   - Navigate to **Site Administration > Notifications** (or run `php admin/cli/upgrade.php` via command line).
   - Complete the installation process.
3. **Verify Editor Button**:
   - Open any editor window (e.g. course section summary or assignment description).
   - Verify that the Bibliotech button appears in the toolbar for users with active Bibliotech subscription access.
