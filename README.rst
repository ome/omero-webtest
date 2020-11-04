.. image:: https://github.com/ome/omero-webtest/workflows/OMERO/badge.svg
    :target: https://github.com/ome/omero-webtest/actions

.. image:: https://badge.fury.io/py/omero-webtest.svg
    :target: https://badge.fury.io/py/omero-webtest


OMERO.webtest
=============
OMERO.web app for various prototypes and examples.
This was removed from the main OMERO.web in the 5.0.6 release of OMERO.

Requirements
------------

* OMERO.web 5.6 or newer.

Installing from PyPI
--------------------

This section assumes that an OMERO.web is already installed.

Install the app using `pip <https://pip.pypa.io/en/stable/>`_:

::

    $ pip install omero-webtest

Add webtest custom app to your installed web apps:

::

    $ omero config append omero.web.apps '"omero_webtest"'

Optional: install example webclient plugins:

::

    $ omero config append omero.web.ui.right_plugins '["ROIs", "webtest/webclient_plugins/right_plugin.rois.js.html", "image_roi_tab"]'
    $ omero config append omero.web.ui.center_plugins '["Split View", "webtest/webclient_plugins/center_plugin.splitview.js.html", "split_view_panel"]'

Now restart OMERO.web as normal.


Examples
--------

Existing examples are available on the following URLs:

::

    https://HOST/webtest/examples/IMAGE_ID/embed_big_image.html
    https://HOST/webtest/examples/IMAGE_ID/embed_viewer.html

**Note**: IMAGE_ID can be obtained from public images.

New templates can be added to templates/webtest/examples. New template can benefit from dynamic variables: {{ host_name }} and {{ image_id }} passed through URL.

Included: Rendered template that can be saved locally for further testing as an absolute uri.

Release process
---------------

This repository uses `bump2version <https://pypi.org/project/bump2version/>`_ to manage version numbers.
To tag a release run::

    $ bumpversion release

This will remove the ``.dev0`` suffix from the current version, commit, and tag the release.

To switch back to a development version run::

    $ bumpversion --no-tag [major|minor|patch]

specifying ``major``, ``minor`` or ``patch`` depending on whether the development branch will be a `major, minor or patch release <https://semver.org/>`_. This will also add the ``.dev0`` suffix.

Remember to ``git push`` all commits and tags.

License
-------

OMERO.webtest is released under the AGPL.

Copyright
---------

2016-2020, The Open Microscopy Environment
