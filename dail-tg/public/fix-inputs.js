/**
 * Input field fix for the Dail TG Moderator application
 * This script fixes issues with input fields not being editable
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Run immediately
  fixInputFields();
  
  // And also run after a short delay to catch dynamically loaded fields
  setTimeout(fixInputFields, 1000);
  
  // And again after a bit longer for any late-loading components
  setTimeout(fixInputFields, 2000);
  
  // Extra attempt to populate DID fields
  setTimeout(populateDIDFields, 1500);
  setTimeout(populateDIDFields, 3000);
});

// Function to fix all input fields in the document
function fixInputFields() {
  console.log('Fixing input fields...');
  
  // Find all input elements that might be affected
  const inputFields = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], textarea');
  
  let fixedCount = 0;
  
  // Loop through each input field and apply fixes
  inputFields.forEach(function(input) {
    // Check if this input needs fixing (is not editable)
    if (input.getAttribute('readonly') === 'readonly' || input.getAttribute('disabled') === 'disabled') {
      // Remove readonly and disabled attributes
      input.removeAttribute('readonly');
      input.removeAttribute('disabled');
      
      // Also set contentEditable true to ensure it's editable
      input.setAttribute('contentEditable', 'true');
      
      // Add a css class to mark this as fixed
      input.classList.add('input-fixed');
      
      fixedCount++;
    }
  });
  
  console.log(`Fixed ${fixedCount} input fields`);
}

// Function to populate DID fields if found
function populateDIDFields() {
  console.log('Attempting to populate DID fields...');
  
  // Check if we're on a credentials page
  const isCredentialsPage = window.location.pathname.includes('credentials');
  if (!isCredentialsPage) {
    return;
  }
  
  // Try to get DID values from window or localStorage
  let issuerDid = '';
  let subjectDid = '';
  
  // Try from global window object first
  if (window.dids && window.dids.issuerDid) {
    issuerDid = window.dids.issuerDid;
  }
  
  if (window.dids && window.dids.subjectDid) {
    subjectDid = window.dids.subjectDid;
  }
  
  // Try from localStorage as fallback
  if (!issuerDid && localStorage.getItem('issuerDid')) {
    issuerDid = localStorage.getItem('issuerDid');
  }
  
  if (!subjectDid && localStorage.getItem('subjectDid')) {
    subjectDid = localStorage.getItem('subjectDid');
  }
  
  console.log('Found DIDs: ', { issuerDid, subjectDid });
  
  // Look for issuer DID field
  const issuerDidField = document.querySelector('input[name="issuerDid"]');
  if (issuerDidField && issuerDid) {
    issuerDidField.value = issuerDid;
    triggerChange(issuerDidField);
  }
  
  // Look for subject DID field
  const subjectDidField = document.querySelector('input[name="subjectDid"]');
  if (subjectDidField && subjectDid) {
    subjectDidField.value = subjectDid;
    triggerChange(subjectDidField);
  }
}

// Helper function to trigger change events
function triggerChange(element) {
  const event = new Event('input', { bubbles: true });
  element.dispatchEvent(event);
  
  const changeEvent = new Event('change', { bubbles: true });
  element.dispatchEvent(changeEvent);
}

// Helper to check if an element is editable
function isElementEditable(element) {
  return element.tagName === 'INPUT' || 
         element.tagName === 'TEXTAREA' || 
         element.getAttribute('contenteditable') === 'true';
}

// Create a MutationObserver to watch for new inputs
const observer = new MutationObserver(function(mutations) {
  let shouldFixInputs = false;
  let shouldPopulateDIDs = false;
  
  mutations.forEach(function(mutation) {
    if (mutation.addedNodes.length > 0) {
      // Check if any added nodes are inputs or contain inputs
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const node = mutation.addedNodes[i];
        
        // Check if the node is an element
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if it's an input or contains inputs
          if (isElementEditable(node) || node.querySelector('input, textarea')) {
            shouldFixInputs = true;
          }
          
          // Check if we need to populate DIDs
          if (node.querySelector('input[name="issuerDid"], input[name="subjectDid"]')) {
            shouldPopulateDIDs = true;
          }
        }
      }
    }
  });
  
  // Only run the functions if needed
  if (shouldFixInputs) {
    fixInputFields();
  }
  
  if (shouldPopulateDIDs) {
    populateDIDFields();
  }
});

// Start observing when document.body is available
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
} else {
  // If document.body isn't available yet, wait for it
  window.addEventListener('DOMContentLoaded', function() {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
} 