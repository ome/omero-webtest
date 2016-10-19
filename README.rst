.. image:: https://travis-ci.org/openmicroscopy/omero-webtest.svg?branch=master
    :target: https://travis-ci.org/openmicroscopy/omero-webtest

.. image:: https://badge.fury.io/py/omero-webtest.svg
    :target: https://badge.fury.io/py/omero-webtest


OMERO.webtest
=============
OMERO.web app for various prototypes and examples.
This was removed from the main OMERO.web in the 5.0.6 release of OMERO.

Requirements
============

* OMERO 5.1.0 or later.

Installation
============

Install OMERO.web.

This app installs into the OMERO.web framework.

::

    $ pip install omero-webtest

Add webtest custom app to your installed web apps:

::

    $ bin/omero config append omero.web.apps '"omero_webtest"'

Optional: install example webclient plugins:

::

    $ bin/omero config append omero.web.ui.right_plugins '["ROIs", "webtest/webclient_plugins/right_plugin.rois.js.html", "image_roi_tab"]'
    $ bin/omero config append omero.web.ui.center_plugins '["Split View", "webtest/webclient_plugins/center_plugin.splitview.js.html", "split_view_panel"]'

Now restart OMERO.web as normal.

**Warning**:

if OMERO.webtest is installed with OMERO version prior to **5.2.6**,
the url will be https://your-web-server/omero_webtest instead of https://your-web-server/webtest as previously. This is due to a package re-organization required to distribute the application using a package manager.
If installed with OMERO **5.2.6 and older**, the url will be back to https://your-web-server/webtest.


Examples
========

Existing examples are available on the following URLs:

::

    https://HOST/webtest/examples/IMAGE_ID/embed_big_image.html
    https://HOST/webtest/examples/IMAGE_ID/embed_viewer.html

**Note**: IMAGE_ID can be obtained from public images.

New templates can be added to templates/webtest/examples. New template can benefit from dynamic variables: {{ host_name }} and {{ image_id }} passed through URL.

Included: Rendered template that can be saved locally for further testing as an absolute uri.

License
-------

OMERO.webtest is released under the AGPL.

Copyright
---------

2016, The Open Microscopy Environment
