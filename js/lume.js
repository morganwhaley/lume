var Lume = function() {
    // Create a feeds object we can add to if we want more photo streams later. This way all the feed info is in one place.
    this.feeds = {
        flickr: {
            api_key: 'bda4e281c1bcfdfd957cf2181b858c77',
            tags: 'shiba',
            media: 'photos',
            per_page: '40'
        }
    };
};

Lume.prototype.init = function() {
    this.callFlickrPhotoFeed();
};

// Get the Flickr API call ready and happening
Lume.prototype.callFlickrPhotoFeed = function() {
    var flickrReq = this.feeds.flickr;
    var url = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=' + flickrReq.api_key + '&tags=' + flickrReq.tags + '&media=' + flickrReq.media + '&per_page=' + flickrReq.per_page + '&public=1&format=json&nojsoncallback=1';
    var context = this;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send();
    xhr.onload = function() {
        if (xhr.status === 200) {
            // Parse the JSON results and send them over for normalization into our UI
            var JSONResults = JSON.parse(xhr.responseText);
            context.normalizePhotoResults(JSONResults);
        }
        else {
            // Create a graceful failure if the call fails
            context.handleRequestError(xhr.status);
        }
    }
};

Lume.prototype.normalizePhotoResults = function(result) {
    if (typeof result === 'undefined') {
        return;
    }
    var context = this;
    for (var item in result.photos.photo) {
        var photo = result.photos.photo[item];
        // Create a photo item object we can work with in other functions
        var currentPhotoItem = {
            farm_id: photo.farm,
            title: photo.title,
            id: photo.id,
            secret: photo.secret,
            server: photo.server
        };
        this.createPhotoItem(currentPhotoItem);
    }
};

Lume.prototype.handleRequestError = function(status) {
    document.getElementsByTagName('h1').textContent = 'Sorry, something went wrong with the feed!';
};

// Create the thumbnail URLs
Lume.prototype.buildPhotoThumbURLs = function(photoItemObj) {
    return 'https://farm' + photoItemObj.farm_id + '.staticflickr.com/' + photoItemObj.server + '/' + photoItemObj.id + '_' + photoItemObj.secret + '_m.jpg';
};

// Create the fullsize URLs for the light boxes from the image source of the target
Lume.prototype.buildFullsizePhotoURLs = function(thumbnailPath) {
    // strip out the character before file extension
    var fullsizeImg = thumbnailPath.replace('_m.jpg', '_c.jpg');
    return fullsizeImg;
};

Lume.prototype.createPhotoItem = function(currentPhotoItem) {
    var context = this;

    // Create each separate thumbnail in the DOM and add them to the #gallery div
    var thumbnailPath = this.buildPhotoThumbURLs(currentPhotoItem);
    var lightboxThumb = document.createElement('img');
    lightboxThumb.setAttribute('src', thumbnailPath);
    lightboxThumb.setAttribute('class', 'photo_thumb');
    lightboxThumb.setAttribute('data-photo-title', currentPhotoItem.title);

    // Create links to full size images for each photo
    var photoLink = this.createPhotoLink(thumbnailPath);
    photoLink.appendChild(lightboxThumb);

    // Append the images and links to the gallery
    document.getElementById('gallery').appendChild(photoLink);

    // Attach a click listener to each photo to launch the lighbox
    lightboxThumb.addEventListener('click', function(e) { e.preventDefault(); context.handlePhotoClick(e); });
};

Lume.prototype.createPhotoLink = function(thumbnailPath) {
    var photoLink = document.createElement('a');
    photoLink.setAttribute('href', this.buildFullsizePhotoURLs(thumbnailPath));
    return photoLink;
};

Lume.prototype.handlePhotoClick = function(e) {
    var target = e.target;
    var anchor = target.parentNode;
    var fullsizeImage = anchor.getAttribute('href');

    this.launchLightbox(target, fullsizeImage);
};

Lume.prototype.launchLightbox = function(target, image) {
    var context = this;
    var lightbox = document.getElementById('lightbox');
    var overlay = document.getElementById('overlay');

    // Set up image in lightbox
    lightbox.style.display = 'block';
    this.loadImageIntoLightbox(image, target);

    // Set up next and previous links
    this.createNextAndPreviousLinks(target.parentNode);

    // Handle overlay here with the lightbox
    overlay.style.display = 'block';
    this.sizeLightboxOverlay();
    this.assignLightboxEvents();
};

Lume.prototype.loadImageIntoLightbox = function(image, target) {
    var lightboxImage = document.getElementById('lightbox-image');
    lightboxImage.setAttribute('src', image);

    // prevent image height from exceeding screen allowance
    lightboxImage.style.maxHeight = (window.innerHeight * 0.75) + 'px';

    // Load image title
    this.loadPhotoTitleInLightbox(target);
};

Lume.prototype.loadPhotoTitleInLightbox = function(image) {
    // Load title of image
    document.getElementById('photo-title').textContent = image.getAttribute('data-photo-title');
};

Lume.prototype.createNextAndPreviousLinks = function(anchor) {
    var nextHref = '';
    var previousHref = '';

    // Last photo item gives back null for next sibling
    if (anchor.nextSibling !== null) {
        nextHref = anchor.nextSibling.getAttribute('href');
    }
    // First photo item gives back a node of "#text" for previous sibling
    if (anchor.previousSibling.nodeName !== '#text') {
        previousHref = anchor.previousSibling.getAttribute('href');
    }

    // Show or hide next and previous if we are at the end or the beginning of the photo set
    if (previousHref === '') {
        document.getElementById('prev').style.display = 'none';
    }
    else {
        document.getElementById('prev').setAttribute('href', previousHref);
        document.getElementById('prev').style.display = 'block';
    }

    if (nextHref === '') {
        document.getElementById('next').style.display = 'none';
    }
    else {
        document.getElementById('next').setAttribute('href', nextHref);
        document.getElementById('next').style.display = 'block';
    }

};

// Event binders for lightbox
Lume.prototype.assignLightboxEvents = function() {
    var context = this;
    window.onresize = function() { context.sizeLightboxOverlay(); }
    document.getElementById('overlay').onclick = function() { context.resetLightbox(lightbox, overlay); }
    document.getElementById('close-lightbox').onclick = function() { context.resetLightbox(lightbox, overlay); }
    document.getElementById('next').onclick = function(e) {
        e.preventDefault();
        context.handleNavClick(e);
    }
    document.getElementById('prev').onclick = function(e) {
        e.preventDefault();
        context.handleNavClick(e);
    }
};

Lume.prototype.handleNavClick = function(e) {
    var target = e.target;
    var image = target.getAttribute('href');
    var photoInGallery = null;

    // Rebuild the next and previous based on corresponding thumbnail so we can recycle the creation method
    var galleryLinks = document.getElementById('gallery').children;
    for (i = 0; i < galleryLinks.length; i++) {
        if (galleryLinks[i].href == image) {
            // Get the anchor and pass it over
            photoInGallery = galleryLinks[i];
        }
    }

    // Grab the title of the new photo
    var photoImage = photoInGallery.childNodes[0];
    
    // Load the image from the anchor into the lightbox and assign correct title
    this.loadImageIntoLightbox(image, target);
    this.loadPhotoTitleInLightbox(photoImage);

    // Update next and previous so we move through the set
    this.createNextAndPreviousLinks(photoInGallery);
};


// Have overlay size with screen
Lume.prototype.sizeLightboxOverlay = function() {
    var overlay = document.getElementById('overlay');
    overlay.style.height = window.innerHeight + 'px';
    overlay.style.width = window.innerWidth + 'px';
};

// Clear all lightbox value when we close it
Lume.prototype.resetLightbox = function(lightbox, overlay) {
    lightbox.style.display = 'none';
    document.getElementById('lightbox-image').setAttribute('src', '');
    overlay.style.display = 'none';
    overlay.style.zIndex = '0';
};


document.addEventListener('DOMContentLoaded', function() {
  var lume = new Lume();
  lume.init();
});