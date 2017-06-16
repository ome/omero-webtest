#!/usr/bin/env python
# -*- coding: utf-8 -*-
from django.conf.urls import url, patterns
from django.views.generic.base import TemplateView

from . import views


urlpatterns = patterns(
    'django.views.generic.simple',

    url(r'^examples/(?P<image_id>[0-9]+)/(?P<template>[a-z0-9_].*)',
        lambda request, image_id, template:
            views.ExamplesView.as_view(
                template_name=("webtest/examples/%s" % template),
                image_id=image_id)(request)),

    # index 'home page' of the webtest app
    url(r'^$', views.index, name='webtest_index'),

    # 'Hello World' example from tutorial on
    # http://trac.openmicroscopy.org.uk/ome/wiki/OmeroWeb
    url(r'^dataset/(?P<dataset_id>[0-9]+)/$', views.dataset,
        name="webtest_dataset"),

    # Another simple example - shows a stack preview for an image
    # with multiple Z sections
    url(r'^stack_preview/(?P<image_id>[0-9]+)/$', views.stack_preview,
        name="webtest_stack_preview"),

    url(r'^static_example/$', TemplateView.as_view(
        template_name='webtest/demo_viewers/static_example.html'),
        name="static_example_viewer"),

    # Displays images (one per row) one channel per column in a grid.
    # Params are passed in request, E.g. imageIds
    url(r'^split_view_figure/$', views.split_view_figure,
        name="webtest_split_view_figure"),
    url(r'^split_view_figure_plugin/$', views.split_view_figure,
        {"template": "webtest/webclient_plugins/split_view_figure.html"},
        name="webtest_split_view_figure_plugin"),
    url(r'^split_view_fig_include/$', views.split_view_figure,
        {"template": "webtest/webclient_plugins/split_view_fig_include.html"},
        name="webtest_split_view_fig_include"),

    # View a dataset as two panels of images,
    # each with different rendering setting
    url(r'^dataset_split_view/(?P<dataset_id>[0-9]+)/',
        views.dataset_split_view, name='webtest_dataset_split_view'),
    url(r'^dataset_split_include/(?P<dataset_id>[0-9]+)/',
        views.dataset_split_view,
        {"template": "webtest/webclient_plugins/dataset_split_include.html"},
        name='webtest_dataset_split_include'),

    # view an image in grid with the Z, C, T dimensions split
    # over the x or y axes as chosen by user.
    url(r'^image_dimensions/(?P<image_id>[0-9]+)/',
        views.image_dimensions, name='webtest_image_dimensions'),

    # Viewer overlays individual channels from the same image or
    # different images and manipulate them separately.
    # Translate, scale etc relative to one-another.
    url(r'^channel_overlay_viewer/(?P<iid>[0-9]+)/',
        views.channel_overlay_viewer, name='webtest_channel_overlay_viewer'),
    # this is the url for rendering planes for the viewer
    url(r'^render_channel_overlay/', views.render_channel_overlay,
        name='webtest_render_channel_overlay'),

    # Show a panel of ROI thumbnails for an image
    url(r'^image_rois/(?P<image_id>[0-9]+)/', views.image_rois,
        name='webtest_image_rois'),

    # post a comment annotation to images. parameters are in request:
    # imageIds=123,234  comment=blah ns=Namespace
    # replace=true (replaces existing comment with same ns if found)
    url(r'^add_annotations/$', views.add_annotations,
        name="webtest_add_annotations"),

    # examples of using the webgateway base templates
    url(r'^webgateway_templates/(?P<base_template>[a-z0-9_]+)/',
        views.webgateway_templates, name='webgateway_templates'),
    # same as webgateway base examples, except that these pages
    # use webclient components that require login
    url(r'^webclient_templates/(?P<base_template>[a-z0-9_]+)/',
        views.webclient_templates, name='webclient_templates'),

    url(r'^img_detail/(?:(?P<iid>[0-9]+)/)?$', views.image_viewer,
        name="webtest_image_viewer"),

    # Test the speed of rendering all planes in an image OR images
    # in a Plate or Dataset (e.g. to compare FS)
    url(r'^render_performance/(?P<obj_type>[a-z]+)/(?P<id>[0-9]+)/',
        views.render_performance, name='webtest_render_performance'),
)
