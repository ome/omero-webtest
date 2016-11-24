#!/usr/bin/env python
# -*- coding: utf-8 -*-
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.views import generic
from django.core.urlresolvers import reverse

from omeroweb.webgateway import views as webgateway_views

from omeroweb.webclient.decorators import login_required, render_response

from cStringIO import StringIO

import logging
import omero
from omero.rtypes import rstring
import omero.gateway
import random


logger = logging.getLogger(__name__)


try:
    from PIL import Image
except:  # pragma: nocover
    try:
        import Image
    except:
        logger.error('No Pillow installed,\
            line plots and split channel will fail!')


@login_required()
# wrapper handles login (or redirects to webclient login).
# Connection passed in **kwargs
def dataset(request, dataset_id, conn=None, **kwargs):
    """ 'Hello World' example from tutorial on\
    http://trac.openmicroscopy.org.uk/ome/wiki/OmeroWeb """
    # before OMERO 4.3 this was conn.getDataset(dataset_id)
    ds = conn.getObject("Dataset", dataset_id)
    # generate html from template
    return render(request, 'webtest/dataset.html', {'dataset': ds})


@login_required()
# wrapper handles login (or redirects to webclient login).
# Connection passed in **kwargs
def index(request, conn=None, **kwargs):

    params = omero.sys.ParametersI()
    # limit the number of objects we retrieve
    params.page(0, 10)

    # use Image IDs from request...
    if request.REQUEST.get("Image", None):
        image_ids = request.REQUEST.get("Image", None)
        ids = [int(iid) for iid in image_ids.split(",")]
        images = list(conn.getObjects("Image", ids))
    else:
        # OR find a random image and dataset to display
        # and can be used in links to other pages
        some_images = list(conn.getObjects("Image", params=params))
        img = random.choice(some_images)
        images = [img]

    img_ids = ",".join([str(img2.getId()) for img2 in images])

    # get a random dataset (making sure we get one that has some images in it)
    some_datasets = list(conn.getObjects("Dataset", params=params))
    dataset = random.choice(some_datasets)
    attempts = 0
    while (dataset.countChildren() == 0 and attempts < 10):
        dataset = random.choice(some_datasets)
        attempts += 1

    return render(request,
                  'webtest/index.html',
                  {'images': images, 'imgIds': img_ids, 'dataset': dataset})


@login_required()
def channel_overlay_viewer(request, iid, conn=None, **kwargs):
    """
    Viewer for overlaying separate channels from the same image or
    different images and adjusting horizontal and vertical alignment
    of each
    """
    image = conn.getObject("Image", iid)
    default_z = image.getSizeZ()/2

    if image is not None:
        if image.getSizeC() == 1:
            return HttpResponseRedirect(
                reverse("webgateway.views.full_viewer", args=(iid,)))

    # try to work out which channels should be 'red',
    # 'green', 'blue' based on rendering settings
    red = None
    green = None
    blue = None
    not_assigned = []
    channels = []
    for i, c in enumerate(image.getChannels()):
        channels.append({'name': c.getName()})
        if c.getColor().getRGB() == (255, 0, 0) and red is None:
            red = i
        elif c.getColor().getRGB() == (0, 255, 0) and green is None:
            green = i
        elif c.getColor().getRGB() == (0, 0, 255) and blue is None:
            blue = i
        else:
            not_assigned.append(i)
    # any not assigned - try assigning
    for i in not_assigned:
        if red is None:
            red = i
        elif green is None:
            green = i
        elif blue is None:
            blue = i

    # see if we have z, x, y offsets already annotated on this image
    # added by javascript in viewer
    # e.g. 0|z:1_x:0_y:0,1|z:0_x:10_y:0,2|z:0_x:0_y:0
    ns = "omero.web.channel_overlay.offsets"
    comment = image.getAnnotation(ns)
    # maybe offset comment has been added manually (no ns)
    if comment is None:
        for ann in image.listAnnotations():
            if isinstance(ann, omero.gateway.CommentAnnotationWrapper):
                if ann.getValue().startswith("0|z:"):
                    comment = ann
                    break
    if comment is not None:
        offsets = comment.getValue()
        for o in offsets.split(","):
            index, zxy = o.split("|", 1)
            if int(index) < len(channels):
                key_vals = zxy.split("_")
                for kv in key_vals:
                    key, val = kv.split(":")
                    if key == "z":
                        val = int(val) + default_z
                    channels[int(index)][key] = int(val)

    return render(request,
                  'webtest/demo_viewers/channel_overlay_viewer.html',
                  {'image': image, 'channels': channels,
                   'default_z': default_z, 'red': red, 'green': green,
                   'blue': blue})


@login_required()
def render_channel_overlay(request, conn=None, **kwargs):
    """
    Overlays separate channels (red, green, blue) from the same image
    or different images manipulating each indepdently
    (translate, scale, rotate etc.)
    """
    # request holds info on all the planes we are working on and offset
    # (may not all be visible)
    # planes=0|imageId:z:c:t$x:shift_y:shift_rot:etc,1|imageId...
    # e.g. planes=0|2305:7:0:0$x:-50_y:10,1|2305:7:1:0,2|2305:7:2:0\
    #      &red=2&blue=0&green=1
    planes = {}
    p = request.GET.get('planes', None)
    if p is None:
        return HttpResponse("Request needs plane info to render jpeg e.g.\
            ?planes=0|2305:7:0:0$x:-50_y:10,1|2305:7:1:0,2|2305:7:2:0\
            &red=2&blue=0&green=1")
    for plane in p.split(','):
        infomap = {}
        plane_info = plane.split('|')
        key = plane_info[0].strip()
        info = plane_info[1].strip()
        shift = None
        if info.find('$') >= 0:
            info, shift = info.split('$')
        image_id, z, c, t = [int(i) for i in info.split(':')]
        infomap['imageId'] = image_id
        infomap['z'] = z
        infomap['c'] = c
        infomap['t'] = t
        if shift is not None:
            for kv in shift.split("_"):
                k, v = kv.split(":")
                infomap[k] = v
        planes[key] = infomap

    # from the request we need to know which plane is blue,
    # green, red (if any) by index e.g. red=0&green=2
    red = request.GET.get('red', None)
    green = request.GET.get('green', None)
    blue = request.GET.get('blue', None)

    # like split-view: we want to get single-channel images...

    def translate(image, delta_x, delta_y):

        xsize, ysize = image.size
        mode = image.mode
        bg = Image.new(mode, image.size)
        x = abs(min(delta_x, 0))
        paste_x = max(0, delta_x)
        y = abs(min(delta_y, 0))
        paste_y = max(0, delta_y)

        part = image.crop((x, y, xsize-delta_x, ysize-delta_y))
        bg.paste(part, (paste_x, paste_y))
        return bg

    def get_plane(plane_info):
        """ Returns the rendered plane split into a single channel
        (ready for merging) """
        img = conn.getObject("Image", plane_info['imageId'])
        img.setActiveChannels((plane_info['c']+1,))
        img.setGreyscaleRenderingModel()
        rgb = img.renderImage(plane_info['z'], plane_info['t'])

        # somehow this line is required to prevent an error at 'rgb.split()'
        rgb.save(StringIO(), 'jpeg', quality=90)

        r, g, b = rgb.split()  # go from RGB to L

        x, y = 0, 0
        if 'x' in plane_info:
            x = int(plane_info['x'])
        if 'y' in plane_info:
            y = int(plane_info['y'])

        if x or y:
            r = translate(r, x, y)
        return r

    red_channel = None
    green_channel = None
    blue_channel = None
    if red is not None and red in planes:
        red_channel = get_plane(planes[red])
    if green is not None and green in planes:
        green_channel = get_plane(planes[green])
    if blue is not None and blue in planes:
        blue_channel = get_plane(planes[blue])

    if red_channel is not None:
        size = red_channel.size
    elif green_channel is not None:
        size = green_channel.size
    elif blue_channel is not None:
        size = blue_channel.size

    black = Image.new('L', size)
    red_channel = red_channel and red_channel or black
    green_channel = green_channel and green_channel or black
    blue_channel = blue_channel and blue_channel or black

    merge = Image.merge("RGB", (red_channel, green_channel, blue_channel))
    # convert from PIL back to string image data
    rv = StringIO()
    compression = 0.9
    merge.save(rv, 'jpeg', quality=int(compression*100))
    jpeg_data = rv.getvalue()

    rsp = HttpResponse(jpeg_data, content_type='image/jpeg')
    return rsp


@login_required()
def add_annotations(request, conn=None, **kwargs):
    """
    Creates a L{omero.gateway.CommentAnnotationWrapper} and
    adds it to the images according to the variables in the http request.

    @param request: The Django L{django.core.handlers.wsgi.WSGIRequest}
                        - imageIds: A comma-delimited list of image IDs
                        - comment: The text to add as a comment to the images
                        - ns: Namespace for the annotation
                        - replace: If "true", try to replace existing
                        annotation with same ns
    @return: A simple html page with a success message
    """
    id_list = request.REQUEST.get('imageIds', None)    # comma - delimited list
    if id_list:
        image_ids = [long(i) for i in id_list.split(",")]
    else:
        image_ids = []

    comment = request.REQUEST.get('comment', None)
    ns = request.REQUEST.get('ns', None)
    replace = request.REQUEST.get('replace', False) in ('true', 'True')

    update_service = conn.getUpdateService()
    ann = omero.model.CommentAnnotationI()
    ann.setTextValue(rstring(str(comment)))
    if ns is not None:
        ann.setNs(rstring(str(ns)))
    ann = update_service.saveAndReturnObject(ann)

    images = []
    for iId in image_ids:
        image = conn.getObject("Image", iId)
        if image is None:
            continue
        if replace and ns is not None:
            old_comment = image.getAnnotation(ns)
            if old_comment is not None:
                old_comment.setTextValue(rstring(str(comment)))
                update_service.saveObject(old_comment)
                continue
        l = omero.model.ImageAnnotationLinkI()
        # use unloaded object to avoid update conflicts
        parent = omero.model.ImageI(iId, False)
        l.setParent(parent)
        l.setChild(ann)
        update_service.saveObject(l)
        images.append(image)

    return render(request,
                  'webtest/util/add_annotations.html',
                  {'images': images, 'comment': comment})


@login_required()
def split_view_figure(request, conn=None, **kwargs):
    """
    Generates an html page displaying a number of images in a grid
    with channels split into different columns.
    The page also includes a form for modifying various display
    parameters and re-submitting to regenerate this page.
    If no 'imageIds' parameter (comma-delimited list) is found in the
    'request', the page generated is simply a form requesting image IDs.
    If there are imageIds, the first ID (image) is used to generate the
    form based on channels of that image.

    @param request: The Django
                L{http request<django.core.handlers.wsgi.WSGIRequest>}
    @return:The http response - html page displaying split view figure.
    """
    query_string = request.META["QUERY_STRING"]

    id_list = request.REQUEST.get('imageIds', None)  # comma - delimited list
    id_list = request.REQUEST.get('Image', id_list)  # we also support 'Image'
    if id_list:
        image_ids = [long(i) for i in id_list.split(",")]
    else:
        image_ids = []

    split_grey = request.REQUEST.get('split_grey', None)
    merged_names = request.REQUEST.get('merged_names', None)
    proj = request.REQUEST.get('proj', "normal")    # intmean, intmax, normal
    try:
        w = request.REQUEST.get('width', 0)
        width = int(w)
    except:
        width = 0
    try:
        h = request.REQUEST.get('height', 0)
        height = int(h)
    except:
        height = 0

    # returns a list of channel info from the image, overridden if values
    # in request
    def get_channel_data(image):
        channels = []
        i = 0
        channel_data = image.getChannels()
        if channel_data is None:    # E.g. failed import etc
            return None
        for i, c in enumerate(channel_data):
            name = request.REQUEST.get('cName%s' % i,
                                       c.getLogicalChannel().getName())
            # if we have channel info from a form, we know that
            # checkbox:None is unchecked (not absent)
            if request.REQUEST.get('cName%s' % i, None):
                active = request.REQUEST.get('cActive%s' % i, None) is not None
                merged = request.REQUEST.get('cMerged%s' % i, None) is not None
            else:
                active = True
                merged = True
            colour = c.getColor()
            if colour is None:
                return None     # rendering engine problems
            colour = colour.getHtml()
            start = request.REQUEST.get('cStart%s' % i, c.getWindowStart())
            end = request.REQUEST.get('cEnd%s' % i, c.getWindowEnd())
            render_all = (None is not
                          request.REQUEST.get('cRenderAll%s' % i, None))
            channels.append({"name": name, "index": i,
                             "active": active, "merged": merged,
                             "colour": colour, "start": start,
                             "end": end, "render_all": render_all})
        return channels

    channels = None
    images = []
    for iid in image_ids:
        image = conn.getObject("Image", iid)
        if image is None:
            continue
        # image.getZ() returns 0 - should return default Z?
        default_z = image.getSizeZ()/2
        # need z for render_image even if we're projecting
        images.append({"id": iid, "z": default_z, "name": image.getName()})
        if channels is None:
            channels = get_channel_data(image)
        if height == 0:
            height = image.getSizeY()
        if width == 0:
            width = image.getSizeX()

    if channels is None:
        return HttpResponse("Couldn't load channels for this image")
    size = {"height": height, "width": width}
    c_strs = []
    if channels:    # channels will be none when page first loads (no images)
        indexes = range(1, len(channels)+1)
        c_string = ",".join(["-%s" % str(c) for c in indexes])  # e.g. -1,-2
        merged_flags = []
        for i, c, in enumerate(channels):
            if c["render_all"]:
                levels = "%s:%s" % (c["start"], c["end"])
            else:
                levels = ""
            if c["active"]:
                on_flag = str(i+1) + "|"
                on_flag += levels
                if split_grey:
                    on_flag += "$FFFFFF"  # e.g. 1|100:505$0000FF
                # e.g. 1,-2,-3  or  1|$FFFFFF,-2,-3
                c_strs.append(c_string.replace("-%s" % str(i+1), on_flag))
            if c["merged"]:  # e.g. '1|200:4000'
                merged_flags.append("%s|%s" % (i+1, levels))
            else:
                merged_flags.append("-%s" % (i+1))  # e.g. '-1'
        # turn merged channels on in the last image
        c_strs.append(",".join(merged_flags))

    template = kwargs.get('template',
                          'webtest/demo_viewers/split_view_figure.html')
    return render(request, template,
                  {'images': images, 'c_strs': c_strs, 'imageIds': id_list,
                   'channels': channels, 'split_grey': split_grey,
                   'merged_names': merged_names, 'proj': proj, 'size': size,
                   'query_string': query_string})


@login_required()
def dataset_split_view(request, dataset_id, conn=None, **kwargs):
    """
    Generates a web page that displays a dataset in two panels,
    with the option to choose different rendering settings (channels on/off)
    for each panel. It uses the render_image url for each
    image, generating the full sized image which is scaled down to view.

    The page also includes a form for editing the channel settings and
    display size of images.
    This form resubmits to this page and displays the page again with
    updated parameters.

    @param request: The Django
                    L{http request<django.core.handlers.wsgi.WSGIRequest>}
    @param dataset_id: The ID of the dataset.
    @type dataset_id: Number.

    @return: The http response - html page displaying split view figure.
    """
    dataset = conn.getObject("Dataset", dataset_id)

    try:
        size = request.REQUEST.get('size', 100)
        size = int(size)
    except:
        size = 100

    # returns a list of channel info from the image, overridden if
    # values in request
    def get_channel_data(image):
        channels = []
        i = 0
        chs = image.getChannels()
        if chs is None:
            return []
        for i, c in enumerate(chs):
            if c is None:
                continue
            name = c.getLogicalChannel().getName()
            # if we have channel info from a form, we know that
            # checkbox:None is unchecked (not absent)
            if request.REQUEST.get('cStart%s' % i, None):
                active_left = (None is not request.REQUEST.get(
                               'cActiveLeft%s' % i, None))
                active_right = (None is not request.REQUEST.get(
                                'cActiveRight%s' % i, None))
            else:
                active_left = True
                active_right = True
            colour = c.getColor()
            if colour is None:
                continue    # serious rendering engine problems
            colour = colour.getHtml()
            start = request.REQUEST.get('cStart%s' % i, c.getWindowStart())
            end = request.REQUEST.get('cEnd%s' % i, c.getWindowEnd())
            render_all = (None is not request.REQUEST.get(
                          'cRenderAll%s' % i, None))
            channels.append({"name": name, "index": i,
                             "active_left": active_left,
                             "active_right": active_right, "colour": colour,
                             "start": start, "end": end,
                             "render_all": render_all})
        return channels

    images = []
    channels = None

    for image in dataset.listChildren():
        if channels is None or len(channels) == 0:
            channels = get_channel_data(image)
        # image.getZ() returns 0 - should return default Z?
        default_z = image.getSizeZ()/2
        # need z for render_image even if we're projecting
        images.append({"id": image.getId(), "z": default_z,
                       "name": image.getName()})

    if channels is None:
        return HttpResponse("<p class='center_message'>No\
            Images in Dataset<p>")

    left_flags = []
    right_flags = []
    for i, c, in enumerate(channels):
        if c["render_all"]:
            levels = "%s:%s" % (c["start"], c["end"])
        else:
            levels = ""
        if c["active_left"]:
            left_flags.append("%s|%s" % (i+1, levels))   # e.g. '1|200:4000'
        else:
            left_flags.append("-%s" % (i+1))  # e.g. '-1'
        if c["active_right"]:
            right_flags.append("%s|%s" % (i+1, levels))  # e.g. '1|200:4000'
        else:
            right_flags.append("-%s" % (i+1))  # e.g. '-1'

    c_left = ",".join(left_flags)
    c_right = ",".join(right_flags)

    template = kwargs.get('template',
                          'webtest/webclient_plugins/dataset_split_view.html')

    return render(request, template,
                  {'dataset': dataset, 'images': images,
                   'channels': channels, 'size': size,
                   'c_left': c_left, 'c_right': c_right})


@login_required()
def image_dimensions(request, image_id, conn=None, **kwargs):
    """
    Prepare data to display various dimensions of a multi-dim
    image as axes of a grid of image planes
    e.g. x-axis = Time, y-axis = Channel.
    """
    image = conn.getObject("Image", image_id)
    if image is None:
        return render(request,
                      'webtest/demo_viewers/image_dimensions.html', {})

    mode = request.REQUEST.get('mode', None) and 'g' or 'c'
    dims = {'Z': image.getSizeZ(), 'C': image.getSizeC(),
            'T': image.getSizeT()}

    default_y_dim = 'Z'

    x_dim = request.REQUEST.get('xDim', 'C')
    if x_dim not in dims.keys():
        x_dim = 'C'

    y_dim = request.REQUEST.get('yDim', default_y_dim)
    if y_dim not in dims.keys():
        y_dim = 'Z'

    x_frames = int(request.REQUEST.get('xFrames', 5))
    x_size = dims[x_dim]
    y_frames = int(request.REQUEST.get('yFrames', 10))
    y_size = dims[y_dim]

    x_frames = min(x_frames, x_size)
    y_frames = min(y_frames, y_size)

    x_range = range(x_frames)
    y_range = range(y_frames)

    # 2D array of (theZ, theC, theT)
    grid = []
    for y in y_range:
        grid.append([])
        for x in x_range:
            iid, the_z, the_c, the_t = image.id, 0, None, 0
            if x_dim == 'Z':
                the_z = x
            if x_dim == 'C':
                the_c = x
            if x_dim == 'T':
                the_t = x
            if y_dim == 'Z':
                the_z = y
            if y_dim == 'C':
                the_c = y
            if y_dim == 'T':
                the_t = y
            grid[y].append((iid, the_z, the_c is not None and the_c+1 or None,
                            the_t))

    size = {"height": 125, "width": 125}

    return render(request, 'webtest/demo_viewers/image_dimensions.html',
                  {'image': image, 'grid': grid, "size": size, "mode": mode,
                   'xDim': x_dim, 'xRange': x_range, 'yRange': y_range,
                   'yDim': y_dim, 'xFrames': x_frames, 'yFrames': y_frames})


@login_required()
def image_rois(request, image_id, conn=None, **kwargs):
    """ Simply shows a page of ROI thumbnails for the specified image """
    roi_service = conn.getRoiService()
    result = roi_service.findByImage(long(image_id), None, conn.SERVICE_OPTS)
    roi_ids = [r.getId().getValue() for r in result.rois]
    return render(request, 'webtest/demo_viewers/image_rois.html',
                  {'roiIds': roi_ids})


def webgateway_templates(request, base_template):
    """ Simply return the named template. Similar functionality to
    django.views.generic.simple.direct_to_template """
    template_name = 'webtest/webgateway/%s.html' % base_template
    return render(request, template_name, {})


@login_required()
@render_response()
def webclient_templates(request, base_template, **kwargs):
    """ Simply return the named template. Similar functionality to
    django.views.generic.simple.direct_to_template """
    template_name = 'webtest/webgateway/%s.html' % base_template
    return {'template': template_name}


@login_required()
def image_viewer(request, iid=None, conn=None, **kwargs):
    """ This view is responsible for showing pixel data as images.
    Delegates to webgateway, using share connection if appropriate """

    if iid is None:
        iid = request.REQUEST.get('image')

    template = 'webtest/webclient_plugins/center_plugin.fullviewer.html'

    return webgateway_views.full_viewer(request, iid, _conn=conn,
                                        template=template, **kwargs)


@login_required()
def stack_preview(request, image_id, conn=None, **kwargs):
    """ Shows a subset of Z-planes for an image """
    image = conn.getObject("Image", image_id)
    image_name = image.getName()
    size_z = image.getSizeZ()
    z_indexes = [0, int(size_z*0.25), int(size_z*0.5),
                 int(size_z*0.75), size_z-1]
    return render(request, 'webtest/stack_preview.html',
                  {'imageId': image_id, 'image_name': image_name,
                   'z_indexes': z_indexes})


@login_required()
def render_performance(request, obj_type, id, conn=None, **kwargs):
    """ Test rendering performance for all planes in an image """
    context = {}
    if obj_type == 'image':
        image = conn.getObject("Image", id)
        image._prepareRenderingEngine()

        # If a 'BIG Image'
        if image._re.requiresPixelsPyramid():
            max_tiles = 50
            tile_list = []
            tile_w, tile_h = image._re.getTileSize()
            cols = image.getSizeX() / tile_w
            rows = image.getSizeY() / tile_h
            tile_list = [{'col': c, 'row': r}
                         for r in range(rows) for c in range(cols)]
            if (len(tile_list) > 2*max_tiles):
                # start in middle of list (looks nicer!)
                tile_list = tile_list[(len(tile_list)/2):]
            tile_list = tile_list[:max_tiles]
            context = {'tileList': tile_list, 'imageId': id}
        # A regular Image
        else:
            zct_list = []
            for z in range(image.getSizeZ()):
                for c in range(image.getSizeC()):
                    for t in range(image.getSizeT()):
                        zct_list.append({'z': z, 'c': c+1, 't': t})
            context = {'zctList': zct_list, 'imageId': id}
    # A Plate
    elif obj_type == 'plate':
        image_ids = []
        plate = conn.getObject("Plate", id)
        for well in plate._listChildren():
            for ws in well.copyWellSamples():
                image_ids.append(ws.getImage().getId().getValue())
        context = {'plate': plate, 'imageIds': image_ids}

    elif obj_type == "dataset":
        dataset = conn.getObject("Dataset", id)
        image_ids = [i.getId() for i in dataset.listChildren()]
        context = {'imageIds': image_ids}

    return render(request,
                  'webtest/demo_viewers/render_performance.html',
                  context)


class ExamplesView(generic.TemplateView):
    """ Examples page view. """

    image_id = None

    def get_context_data(self, **kwargs):
        ctx = super(ExamplesView, self).get_context_data(**kwargs)
        ctx['image_id'] = self.image_id
        ctx['host_name'] = self.request.build_absolute_uri(reverse("index"))
        return ctx
