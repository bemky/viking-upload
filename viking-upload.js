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
        item_actions:   ƒ(model)
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
        'click .js-remove':     "removeItem"
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
        item: (model) => `<div class="viking-upload-item"><img></div>`,
        item_image: (model, thumbnail) => `<img src="#RENDER_URL" >`,
        item_filename: (model) => model.get('filename'),
        item_uploading: (model) => `
            <div class="viking-upload-overlay">
                <div class="viking-upload-progress"><progress value="0" max="1"></progress></div>
            </div>
            <img>
        `,
        item_actions: (model) => `
            <div class="viking-upload-actions">
                <span class="js-remove" style="cursor:pointer">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                    	 width="28px" height="28px" viewBox="0 0 28 28" enable-background="new 0 0 28 28" xml:space="preserve" fill="#FFFFFF">
                    <path d="M11,11.5v9c0,0.146-0.047,0.266-0.141,0.359C10.766,20.952,10.646,21,10.5,21h-1c-0.146,0-0.266-0.047-0.359-0.141
                        C9.048,20.766,9,20.646,9,20.5v-9c0-0.146,0.047-0.266,0.141-0.359C9.234,11.048,9.354,11,9.5,11h1c0.146,0,0.266,0.047,0.359,0.141
                        C10.952,11.235,11,11.354,11,11.5z M15,11.5v9c0,0.146-0.047,0.266-0.141,0.359C14.766,20.952,14.646,21,14.5,21h-1
                        c-0.146,0-0.266-0.047-0.359-0.141C13.048,20.766,13,20.646,13,20.5v-9c0-0.146,0.047-0.266,0.141-0.359
                        C13.234,11.048,13.354,11,13.5,11h1c0.146,0,0.266,0.047,0.359,0.141C14.952,11.235,15,11.354,15,11.5z M19,11.5v9
                        c0,0.146-0.047,0.266-0.141,0.359C18.766,20.952,18.646,21,18.5,21h-1c-0.146,0-0.266-0.047-0.359-0.141
                        C17.048,20.766,17,20.646,17,20.5v-9c0-0.146,0.047-0.266,0.141-0.359C17.234,11.048,17.354,11,17.5,11h1
                        c0.146,0,0.266,0.047,0.359,0.141C18.952,11.235,19,11.354,19,11.5z M21,22.812V8.001H7v14.812c0,0.23,0.036,0.441,0.109,0.633
                        c0.073,0.193,0.148,0.335,0.227,0.424s0.133,0.133,0.164,0.133h13c0.031,0,0.086-0.044,0.164-0.133s0.154-0.229,0.227-0.424
                        C20.965,23.254,21,23.043,21,22.812z M10.5,6h7l-0.75-1.828C16.678,4.078,16.589,4.021,16.484,4h-4.953
                        c-0.104,0.021-0.193,0.078-0.266,0.172L10.5,6z M25,6.5v1c0,0.146-0.047,0.266-0.141,0.359C24.766,7.952,24.646,8,24.5,8H23v14.812
                        c0,0.863-0.244,1.61-0.734,2.242c-0.488,0.629-1.078,0.943-1.766,0.943h-13c-0.688,0-1.276-0.305-1.766-0.914
                        C5.244,24.477,5,23.738,5,22.874V7.999H3.5c-0.146,0-0.266-0.047-0.359-0.141C3.048,7.764,3,7.645,3,7.499v-1
                        C3,6.353,3.047,6.233,3.141,6.14C3.235,6.047,3.354,6,3.5,5.999h4.828L9.422,3.39c0.156-0.385,0.438-0.713,0.844-0.984
                        C10.673,2.135,11.084,2,11.5,2h5c0.416,0,0.828,0.135,1.234,0.406c0.406,0.271,0.688,0.599,0.844,0.984l1.094,2.609H24.5
                        c0.146,0,0.266,0.047,0.359,0.141C24.952,6.234,25,6.354,25,6.5L25,6.5z"/>
                    </svg>
                </span>
            </div>
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
        this.item_container.append(this.choose_file);
        
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
        var existing_el = this.$(`#${model.cid}`);
        if(existing_el.length == 0) {
            existing_el = $('<div>');
            existing_el.appendTo(this.item_container);
            this.choose_file.appendTo(this.item_container); // Move chooser to end
        }
        var el = $(this.templates.item(model));
        existing_el.replaceWith(el);
        el.attr('id', model.cid);
        el.append(this.templates.item_actions(model));

        if (el.find('img').length > 0)
            el.find('img').replaceWith(this.itemImageTag.bind(this)(model));

        if (model.get('id')) {
            this.trigger('add', model, el);
        } else {
            el.append(this.templates.item_uploading(model));
        }

        this.listenTo(model, 'remove', () => el.remove());
        this.listenTo(model, 'error', (errorMessage) => el.append(this.templates.item_error(errorMessage)));
        this.listenTo(model, 'progress', (percentage) => el.find('progress').width(90 * percentage + "%"));

        return el;
    },
    
    removeItem: function(e){
        var id = $(e.currentTarget).parents('[id]').attr('id');
        this.collection.remove(id);
        return false;
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
        this.addItem(model);
        
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
                model.trigger('error', errorMessage);
            },
            success: function(response){
                model.set(response);
                model.trigger('sync');
            }.bind(this),
            complete: function (xhr){
                this.polls = _.without(this.polls, model);
                if(this.collection.get(model.get('id'))){
                    this.addItem(model);
                    model.trigger('error', 'Duplicate');
                } else {
                    this.collection.add(model);
                }
                
                if (this.polls.length == 0) this.collection.trigger('upload', model);
            }.bind(this),
            xhr: function () {
                var xhr = $.ajaxSettings.xhr();
                xhr.upload.onprogress = () => {
                    model.trigger('progress', e.loaded / e.total);
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
    }
    
})