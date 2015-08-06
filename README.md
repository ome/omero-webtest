OMERO.webtest
============

OMERO.web app for various prototypes and examples.
This was removed from the main OMERO.web in the 5.0.6 release of OMERO.


Requirements
============

* OMERO 4.4.x or OMERO 5.x

Installation
============

Clone or download and make sure that the /webtest/ folder
is within a directory that is on your $PYTHONPATH.

Add webtest to your installed web apps:

	$ bin/omero config append omero.web.apps '"webtest"'

NB: note that double quotes are wrapped by single quotes.
Windows users will need to do

    $ bin\omero config append omero.web.apps "\"webtest\""

Optional: install example webclient plugins:

    $ bin/omero config append omero.web.ui.right_plugins '["ROIs", "webtest/webclient_plugins/right_plugin.rois.js.html", "image_roi_tab"]'
    $ bin/omero config append omero.web.ui.center_plugins '["Split View", "webtest/webclient_plugins/center_plugin.splitview.js.html", "split_view_panel"]'


Restart your webserver and open your browser at:

	<your server>/webtest/


Examples
========

Existing examples are available on the following URLs:

    https://HOST/webtest/examples/IMAGE_ID/embed_big_image.html
    https://HOST/webtest/examples/IMAGE_ID/embed_viewer.html

NB: note IMAGE_ID can be obtained from public images.

New templates can be added to templates/webtest/examples. New template can benefit from dynamic variables: {{ host_name }} and {{ image_id }} passed through URL.

Rendered template can be saved locally for further testing as a absolute uri is included.
