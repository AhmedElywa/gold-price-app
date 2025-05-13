// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(function(error) {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// Add to home screen event handling for iOS/Safari
//let deferredPrompt;
const addBtn = document.createElement('button');
addBtn.style.display = 'none';

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  //deferredPrompt = e;
  // Update UI to notify the user they can add to home screen
  addBtn.style.display = 'block';
});

// For iOS Safari
let isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
let isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator.standalone || false);

if (isIOS && !isInStandaloneMode) {
  // Show iOS install instructions
  const iosPrompt = document.createElement('div');
  iosPrompt.style.position = 'fixed';
  iosPrompt.style.bottom = '0';
  iosPrompt.style.left = '0';
  iosPrompt.style.right = '0';
  iosPrompt.style.zIndex = '1000';
  iosPrompt.style.padding = '12px';
  iosPrompt.style.background = 'rgba(255, 255, 255, 0.8)';
  iosPrompt.style.boxShadow = '0 -1px 5px rgba(0, 0, 0, 0.2)';
  iosPrompt.style.display = 'flex';
  iosPrompt.style.alignItems = 'center';
  iosPrompt.style.justifyContent = 'space-between';
  
  const message = document.createElement('p');
  message.textContent = 'Install this app on your home screen: tap Share then "Add to Home Screen"';
  message.style.margin = '0';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.cursor = 'pointer';
  
  closeBtn.addEventListener('click', () => {
    iosPrompt.style.display = 'none';
    localStorage.setItem('pwaPromptDismissed', 'true');
  });
  
  iosPrompt.appendChild(message);
  iosPrompt.appendChild(closeBtn);
  
  // Only show if not previously dismissed
  if (!localStorage.getItem('pwaPromptDismissed')) {
    window.addEventListener('load', () => {
      document.body.appendChild(iosPrompt);
    });
  }
} 