# Viking/Upload
A Drag and Drop Upload UI for [Viking.js](https://github.com/malomalo/viking) Models

```javascript
import VikingUpload from 'viking-upload';

new VikingUpload({
    el: $('.js-photos'),
    collection: this.model.get('photos'),
    thumbnailSize: "128x128",
    templates: {
        item_image: (model, thumbnail) => `http://image-server.com/${model.get('id)}/${thumbnail.width}x${thumbnail.height}.jpg`
    }
}).render();
this.model.get('photos').on('add', () => this.model.save(null, {include: {photos: true}}))
```

### Options
```javascript
    thumbnailSize: string // WxH (default: '128x128')
    defaults: {} // default parameters for new records
    ajax: {} // default options for ajax
    templates: {
        items:          ƒ(view)
        choose_file:    ƒ(view)
        drag_overlay:   ƒ(view)
        item:           ƒ(model) // <img> is replaced with rendered image tag
        item_image:     ƒ(model, {height: 64, width: 64}) // return <img>
        item_uploading: ƒ(model) // <img> is replaced with rendered image tag, <progress> width set on_progress
        item_filename:  ƒ(model)
        item_error:     ƒ(errorMessage)
    }
```

### Events
```javascript
    add: (model, el) // after model item element is appended to items container
    upload: (model) // after successful upload
```
