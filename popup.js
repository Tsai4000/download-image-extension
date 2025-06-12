document.addEventListener('DOMContentLoaded', () => {
  const imageContainer = document.getElementById('image-container');
  const downloadSelectedButton = document.getElementById('download-selected');
  const downloadAllButton = document.getElementById('download-all');
  const minWidthInput = document.getElementById('min-width');
  const minHeightInput = document.getElementById('min-height');
  const refreshButton = document.getElementById('refresh-images');

  function fetchAndDisplayImages() {
    const minWidth = parseInt(minWidthInput.value, 10) || 300;
    const minHeight = parseInt(minHeightInput.value, 10) || 300;
    imageContainer.innerHTML = ''; // Clear previous images

    // Get images from content script
    chrome.tabs.query({ active: true, currentWindow: true, status: 'complete' }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].id) {
        imageContainer.textContent = 'Cannot access active tab or tab is not fully loaded. Please ensure the page is loaded and try refreshing.';
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getImages', minWidth: minWidth, minHeight: minHeight }, (response) => {
        if (chrome.runtime.lastError) {
          // Check if the error is due to no receiving end, which can happen on special pages
          if (chrome.runtime.lastError.message.includes("Could not establish connection. Receiving end does not exist")) {
            imageContainer.textContent = 'Cannot connect to the content script on this page. This may be a restricted page (e.g., Chrome Web Store, chrome:// pages) or the page is not fully loaded.';
          } else {
            imageContainer.textContent = 'Error communicating with content script: ' + chrome.runtime.lastError.message;
          }
          console.error(chrome.runtime.lastError.message);
          return;
        }
        if (response && response.images && response.images.length > 0) {
          response.images.forEach((imageUrl, index) => {
            const imgDiv = document.createElement('div');
            imgDiv.classList.add('image-item');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `image-${index}`;
            checkbox.value = imageUrl;
            checkbox.classList.add('image-checkbox');

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `Image ${index + 1}`;
            img.style.maxWidth = '100px'; // Thumbnail preview
            img.style.maxHeight = '100px';

            const label = document.createElement('label');
            label.htmlFor = `image-${index}`;
            label.appendChild(img);

            imgDiv.appendChild(checkbox);
            imgDiv.appendChild(label);
            imageContainer.appendChild(imgDiv);
          });
        } else {
          imageContainer.textContent = 'No suitable images detected with current settings.';
        }
      });
    });
  }

  // Initial load
  fetchAndDisplayImages();

  // Refresh images when button is clicked
  refreshButton.addEventListener('click', fetchAndDisplayImages);

  // Download selected images
  downloadSelectedButton.addEventListener('click', () => {
    const selectedImages = [];
    document.querySelectorAll('.image-checkbox:checked').forEach(checkbox => {
      selectedImages.push(checkbox.value);
    });
    downloadImages(selectedImages);
  });

  // Download all images
  downloadAllButton.addEventListener('click', () => {
    const allImages = [];
    document.querySelectorAll('.image-checkbox').forEach(checkbox => {
      allImages.push(checkbox.value);
    });
    downloadImages(allImages);
  });

  function downloadImages(urls) {
    urls.forEach((url, index) => {
      // Try to get a better filename
      let filename = `image-${Date.now()}-${index + 1}.jpg`;
      try {
        const urlParts = new URL(url).pathname.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart && lastPart.includes('.')) {
          filename = lastPart;
        } else if (lastPart) {
          filename = `${lastPart}.jpg`; // Add extension if missing
        }
      } catch (e) {
        console.warn('Could not parse URL for filename:', url, e);
      }
      chrome.downloads.download({ url: url, filename: filename });
    });
  }
});
