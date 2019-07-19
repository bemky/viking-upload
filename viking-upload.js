/*
    Viking Upload

    Required
    -----
    collection: Viking.Collection | collection of blobs

    Optional
    -----
    thumbnailSize: string | WxH (default: '128x128')
    defaults: {} | default parameters for new records
    ajax: {} | default options for ajax
    templates: {
        items:          ƒ(view)
        choose_file:    ƒ(view)
        drag_overlay:   ƒ(view)
        item:           ƒ(model) | <img> is replaced with rendered image tag
        item_image:     ƒ(model, {height: 64, width: 64}) | return <img>
        item_uploading: ƒ(model) | <img> is replaced with rendered image tag, <progress> width set on_progress
        item_filename:  ƒ(model)
        item_error:     ƒ(errorMessage)
    }

    Events
    ----
    add: model, el | after model item element is appended to items container
    upload: model | after successful upload
*/

export default Viking.View.extend({
    className: 'viking-upload',
    
    events: {
        "drop":                 "dragDrop",
        "dragover":             "dragOver",
        "dragenter":            "dragEnter",
        "dragleave":            "dragLeave",
        'change input:file':    "chooseFile",
    },
    
    options: {
        thumbnailSize: "128x128",
        defaults: {},
        ajax: {}
    },

    /*
        Defaul Templates
    */
    templates: {
        items: (view) => `<div class="viking-upload-items"></div>`,
        item: (model) => `<div class="viking-upload-item"><img></div`,
        item_image: (model, thumbnail) => `<img src="#RENDER_URL" >`,
        item_filename: (model) => model.get('filename'),
        item_uploading: (model) => `
            <div class="viking-upload-overlay">
                <div class="viking-upload-progress"><progress value="0" max="1"></progress></div>
            </div>
            <img>
        `,
        item_error: (errorMessage) =>  `
            <div class='viking-upload-overlay -error'>
                <div>
                    <div>ERROR</div>
                    <div>${errorMessage}</div>
                </div>
            </div>
        `,
        choose_file: (view) => `
            <div class="viking-upload-choose">
            <label class="" for="viking-upload-${view.cid}" style="width:${view.options.thumbnail.width}px; height: ${view.options.thumbnail.height}px;">
                <span>Upload</span>
            </label>
            <input type="file" multiple style="display:none" id="viking-upload-${view.cid}" />
            </div>
        `,
        drag_overlay: (view) => `
            <div class="viking-upload-drag-overlay">
                <div>Drag Here</div>
            </div>
        `,
    },
    
    render () {
        this.$el.addClass('viking-upload');
        
        this.item_container = $(this.templates.items(this));
        this.$el.append(this.item_container);
    
        this.choose_file = $(this.templates.choose_file(this));
        this.item_container.append(this.item_container);
        
        this.collection.each(this.addItem, this);

        return this;
    },
    
    initialize: function (options) {
        this.polls = [];
        this.dragEnteredEls = [];
        this.windowDragEnteredEls = [];
        
        this.windowDragEnter = this.windowDragEnter.bind(this);
        this.windowDragLeave = this.windowDragLeave.bind(this);
        this.windowDragDrop = this.windowDragDrop.bind(this);
        $(window).on('dragenter', this.windowDragEnter);
        $(window).on('dragleave', this.windowDragLeave);
        $(window).on('drop', this.windowDragDrop);
        
        this.options.thumbnail = {
            width: this.options.thumbnailSize.split("x")[0],
            height: this.options.thumbnailSize.split("x")[1]
        }
        
        if(options.templates){
            Object.keys(this.templates).forEach(function(key){
                options.templates[key] = options.templates[key] ? options.templates[key] : this.templates[key];
            }, this);
            this.templates = options.templates;
        }
        
        this.listenTo(this.collection, 'add', this.addItem);
    },
    
    remove: function () {
        $(window).off('dragenter', this.windowDragEnter);
        $(window).off('dragleave', this.windowDragLeave);
        $(window).off('drop', this.windowDragDrop);
        Viking.View.prototype.remove.apply(this, arguments);
    },
    
    addItem: function (model) {
        var el = $(this.templates.item(model));
        if (el.find('img').length > 0)
            el.find('img').replaceWith(this.itemImageTag.bind(this)(model));
        
        if (model.get('id')) {
            this.trigger('add', model, el);
        } else {
            el.append(this.templates.item_uploading(model));
        }
        
        this.listenTo(model, 'remove', () => el.remove());
        this.item_container.append(el);
        this.choose_file.appendTo(this.item_container); // Move chooser to end
        return el;
    },
    
    itemImageTag: function (model) {
        if (model.get('processing')) {
            var img_div = document.createElement('div');
            $(img_div).addClass('-thumbnail');
            $(img_div).css(this.options.thumbnail);
            
            var img = document.createElement('img');
            $(img_div).append(img);
            if (model.file) {
                var reader = new FileReader();
                reader.readAsDataURL(model.file);
                reader.onloadend = function() {
                    img.src = reader.result;
                }
            }
            
            return img_div;
        } else {
            return this.templates.item_image(model, this.options.thumbnail);
        }
    },
    
    /*
        File Actions
    */
    chooseFile: function (e) {
        ([...e.currentTarget.files]).forEach(this.uploadFile, this);
    },
    
    uploadFile: function (file) {
        var model = new this.collection.model();
        model.file = file;
        var item_el = this.addItem(model);
        
        // TODO check file type
        
        var data = new FormData();
        data.append('file', file);
        
        this.polls.push(model);
        var xhr = $.ajax(_.defaults({}, this.options.ajax, {
            url: this.collection.url(),
            data: data,
            method: 'POST',
            processData: false,
            contentType: false,
            error: (errorMessage) => {
                item_el.append(this.templates.item_error(errorMessage));
            },
            success: function(response){
                model.set(response);
                model.trigger('sync');
                item_el.remove();
                this.collection.add(model);
            }.bind(this),
            complete: function (){
                this.polls = _.without(this.polls, model);
                if (this.polls.length == 0) this.collection.trigger('upload', model);
            }.bind(this),
            xhr: function () {
                var xhr = $.ajaxSettings.xhr();
                xhr.upload.onprogress = () => {
                    item_el.find('progress').width(e.loaded / e.total * 90 + "%");
                };
                return xhr;
            }
        }));
        
    },
    
    /*
        Drag Actions
    */
    windowDragEnter: function (e) {
        e.preventDefault();
        if(e.relatedTarget && e.relatedTarget.nodeType == 3) return;
        if(e.target === e.relatedTarget) return;
        this.windowDragEnteredEls.push(e.target);
        if(this.windowDragEnteredEls.length == 1 && !this.drop_hover) {
            this.drag_hover = $(this.templates.drag_overlay(this));
            this.$el.append(this.drag_hover);
            this.choose_file.css({opacity: 0});
        }
    },
    
    windowDragLeave: function (e) {
        e.preventDefault();
        this.windowDragEnteredEls = _.without(this.windowDragEnteredEls, e.target);
        if (this.windowDragEnteredEls.length === 0 && this.drag_hover) {
            this.drag_hover.remove();
            delete this.drag_hover;
            this.choose_file.css({opacity: 1});
        }
    },
    
    windowDragDrop: function (e) {
        e.preventDefault();
        if(this.drag_hover){
            this.windowDragEnteredEls = [];
            this.dragEnteredEls = [];
            this.drag_hover.remove();
            delete this.drag_hover;
            this.choose_file.css({opacity: 1});
        }
    },
    
    dragEnter: function (e) {
        e.preventDefault();
        if(e.relatedTarget && e.relatedTarget.nodeType == 3) return;
        if(e.target === e.relatedTarget) return;
        this.dragEnteredEls.push(e.target);
        if (this.dragEnteredEls.length === 1 && this.drag_hover) {
            this.drag_hover.addClass('active');
        }
    },
    
    dragLeave: function (e) {
        e.preventDefault();
        this.dragEnteredEls = _.without(this.dragEnteredEls, e.target);
        if (this.dragEnteredEls.length === 0 && this.drag_hover) {
            this.drag_hover.removeClass('active');
        }
    },
    
    dragOver: function (e) {
        e.preventDefault();
    },
    
    dragDrop: function (e) {
        e.preventDefault();
        ([...e.originalEvent.dataTransfer.files]).forEach(this.uploadFile, this);
    },
    
})