/*
 * Author: Steven Cybinski
 * Repository: https://github.com/StevenCyb/dropdown-js
 * Version: 1.0.0
 */
 
 function DropdownJsInitFunc() {
  // Create searchable dropdown element
  window.customElements.define('dropdown-js', 
  class extends HTMLElement {
    constructor() {
      // Call root constructor
      super();

      // Set selection variables
      this.selected = null;
      this.text = '';
      this.value = '';

      // Store reference to self
      var self = this;

      // Create a change event 
      if (window.CustomEvent) {
        this.change = new CustomEvent('change', { cancelable: false });
      } else {
        this.change = document.createEvent('CustomEvent');
        this.change.initCustomEvent('change', false, false, { cancelable: false })
      }

      // Add outside click event to close dropdown if outside
      document.addEventListener('click', function(e) {
        var inside = e.target == self.button || 
                    e.target == self.filterIcon ||
                    e.target == self.closeDropdownIcon ||
                    e.target == self.openDropdownIcon ||
                    e.target == self.dropdownContainer ||
                    e.target == self.optionsContainer ||
                    e.target == self.input;
        if(!inside) {
          for(var i=self.options.length - 1; 0<=i; i--) {
            inside = inside || e.target == self.options[i];
          }
        }
        if (!inside && self.dropdownContainer.classList.contains('open')) {
          self.toggleDropdown(self);
        }
      });

      // Add escape event to close dropdown
      document.addEventListener('keydown', function(e) {
        e = e || window.event;
        if (e.key != undefined && e.key == 'Escape') {
          if(self.dropdownContainer.classList.contains('open')) {
            self.toggleDropdown(self);
          }
        }
      });

      // Create the dropdown toggle button
      this.button = document.createElement('button');
      this.button.innerHTML = this.hasAttribute('selection-placeholder') ? this.getAttribute('selection-placeholder') : 'Select something';
      
      this.button.addEventListener('click', self.toggleDropdown);
      this.prepend(this.button);
      
      // Create dropdown icon if configured
      if(!this.hasAttribute('arrow') || (this.hasAttribute('arrow') && this.getAttribute('arrow') != 'false')) {
        this.openDropdownIcon = document.createElement('div');
        this.openDropdownIcon.classList = 'icon dropdown open';
        this.openDropdownIcon.innerHTML = '&#x25BC';
        this.openDropdownIcon.addEventListener('click', self.toggleDropdown);
        this.prepend(this.openDropdownIcon);
  
        this.closeDropdownIcon = document.createElement('div');
        this.closeDropdownIcon.classList = 'icon dropdown';
        this.closeDropdownIcon.innerHTML = '&#x25B2;';
        this.closeDropdownIcon.addEventListener('click', self.toggleDropdown);
        this.prepend(this.closeDropdownIcon);
      }

      // Create dropdown container
      this.dropdownContainer = document.createElement('div');
      this.dropdownContainer.classList.add('drop-container');
      this.appendChild(this.dropdownContainer);
      
      // Create an input and set placeholder
      this.input = document.createElement('input');
      this.setAttribute('type', 'text');

      this.input.setAttribute('placeholder', 
        this.hasAttribute('filter-placeholder') ? this.getAttribute('filter-placeholder') : 'Search...'
      );
      
      // Set configured or default regex filter operation
      this.filterRegex = this.hasAttribute('filter') ? this.getAttribute('filter') : '.*{{var}}.*';

      // Listen for filter input and perform filtering
      this.input.addEventListener('keyup', function(e) {
        var filter = this.value;

        // Set icon depending on filter content
        if(filter.length == 0) {
          self.filterIcon.classList.remove('cross');
          self.filterIcon.innerHTML = '&#9906;'
        } else {
          self.filterIcon.classList.add('cross');
          self.filterIcon.innerHTML = '&#10006;'
        }

        // Filter options
        filter = filter.toLowerCase().split(' ');
        for (var i = 0; i < self.options.length; i++) {
          var text = (`${self.options[i].innerHTML} ${self.options[i].value}`).toLowerCase(),
          match = true;

          for (var j = 0; j < filter.length; j++) {
            var reg = new RegExp(self.filterRegex.replace('{{var}}', filter[j]))
            if(!reg.test(text)) {
              match = false;
              break;
            }
          }

          self.options[i].style.display = match ? '' : 'none';
        }
      });
      this.dropdownContainer.prepend(this.input);
      
      // Create input button
      this.filterIcon = document.createElement('div');
      this.filterIcon.classList = 'icon';
      this.filterIcon.innerHTML = '&#9906;'
      
      this.filterIcon.addEventListener('click', function() {
        self.input.value = '';
        self.input.dispatchEvent(new Event('keyup'));
      });

      this.dropdownContainer.prepend(this.filterIcon);
      
      // Create dropdown container
      this.optionsContainer = document.createElement('div');
      this.optionsContainer.classList.add('drop-options-container');
      this.dropdownContainer.appendChild(this.optionsContainer);

      // Store all options and hide them
      this.options = this.getElementsByTagName('option'); 
      for(var i=this.options.length - 1; 0<=i; i--) {
        this.options[i].addEventListener('click', function(e) {
          // Remove old selection
          if(self.selected != null) {
            self.selected.classList.remove('selected');
          }

          // Mark clicked option as selected and set new variables
          e.target.classList.add('selected');
          self.button.innerHTML = e.target.innerHTML;
          self.text = e.target.innerHTML;
          self.value = e.target.value;
          self.selected = e.target;

          // Set change event values and dispatch it 
          self.change.selected = self.selected;
          self.change.text = self.text;
          self.change.value = self.value;
          self.dispatchEvent(self.change);
          
          // Close dropdown after selection
          self.toggleDropdown();
          return;
        });
        // Move child to new sub dropdown div
        this.optionsContainer.appendChild(this.options[i]);
      }

      // Set number of options to show
      this.showOptions(this.hasAttribute('default') ? this.getAttribute('default') : 5);

      // Select default if defined
      if(this.hasAttribute('default')) {
        this.selectOption(this.getAttribute('default'))
      }
    }

    showOptions(count) {
      // Create fake element to prevent null pointer
      this.addOption('fake_dropdown_js_measurement', 'fake_dropdown_js_measurement');
      var self = this;

      setTimeout(function(){ 
        // Calculate and set height of options container
        self.optionsContainer.style.maxHeight = `${
          (
            self.options.item(0).offsetHeight + 
            parseInt(window.getComputedStyle(self.options.item(0)).marginTop) +
            parseInt(window.getComputedStyle(self.options.item(0)).marginBottom)
          ) * count
        }px`;

        // Remove fake element
        self.removeOption('fake_dropdown_js_measurement');
       }, 100);
    }

    toggleDropdown(e) {
      // Find root element
      var self = null;
      if(this.dropdownContainer != undefined) {self = this;} 
      else if(this.parentElement.dropdownContainer != undefined) {self = this.parentElement;} 
      else if(e.dropdownContainer != undefined) {self = e;} 

      // Call toggle of child elements
      self.dropdownContainer.classList.toggle('open');
      self.openDropdownIcon.classList.toggle('open');
      self.closeDropdownIcon.classList.toggle('open');
      
      // Prevent click propagation if click event
      if(e != null && e != self) {
        e.preventDefault();
      }
    }

    selectOption(value) {
      for(var i=0; i<this.options.length; i++) {
        if(value == this.options[i].value) {
          this.options[i].click();
          this.toggleDropdown();
          return;
        }
      }
    }

    addOption(value, text) {
      var newOption = document.createElement('option');
      newOption.innerHTML = text;
      newOption.value = value;
      
      // Add new option
      this.optionsContainer.appendChild(newOption);

      // Select default if defined
      if(this.hasAttribute('default')) {
        this.selectOption(this.getAttribute('default'))
      }
    }

    removeOption(value) {
      for (var i = this.options.length - 1; i >= 0; i--) {
        if(value == this.options[i].value) {
          if(value == this.value) {
            // Remove selection
            this.selected = null;
            this.text = '';
            this.value = '';

            // Set selection placeholder or default
            this.button.innerHTML = this.hasAttribute('selection-placeholder') ? this.getAttribute('selection-placeholder') : 'Select';
            
            // Select default if defined
            if(this.hasAttribute('default')) {
              this.selectOption(this.getAttribute('default'))
            }
          }

          // Remove option
          this.options[i].remove();
          
          return;
        }
      }
    }
  });
}

// Register document and window load event
var hasRunDropdownJsInit = false;
var dropdownJsInitFunctions = [DropdownJsInitFunc];

function dropdownJsInit() {
  // Set run flag
  if(hasRunDropdownJsInit) {
    return;
  }
  hasRunDropdownJsInit = true;
  // Run init functions
  for(var i=0; i<dropdownJsInitFunctions.length; i++) {
    dropdownJsInitFunctions[i]();
  }
}
document.addEventListener('DOMContentLoaded', dropdownJsInit, false);
window.addEventListener('load', dropdownJsInit, false);

// Inject global css
var style = document.createElement('style');
style.innerHTML = `
dropdown-js {
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
dropdown-js button {
  width: 120px;
  font-size: 12px;
  min-width: 10px;
  cursor: pointer;
  color: #333333;
  padding: 5px 8px;
  padding-right: 20px;
  margin: 0;
  box-sizing: border-box;
  text-align: left;
  background-color: #ffffff;
  border: solid 1px #333333;
  transition: all 0.3s ease-in-out;
  outline:none;
}
dropdown-js button:hover, dropdown-js button:focus {
  background-color: #eeeeee;
  border-color: #000000;
  outline: none;
}
dropdown-js .icon {
  position:absolute;
  font-weight: bold;
  font-size: 20px;
  top: -2px;
  right:5px;
  transform: rotate(-45deg);
  transition: opacity 0.3s ease-in-out;
}
dropdown-js .icon.dropdown {
  display: none;
  top: 4px;
  cursor: pointer;
  transform: rotate(0);
  font-size: 12px;
  font-weight: normal;
}
dropdown-js .icon.cross {
  top: 1px;
  cursor: pointer;
  transform: rotate(0);
  opacity: 0.7;
  color: #ff6961;
  font-size: 15px;
}
dropdown-js .icon.open {
  display: block;
}
dropdown-js .icon:hover {
  opacity: 1;
}
dropdown-js input {
  width: 100%;
  min-width: 10px;
  padding: 5px 8px;
  box-sizing: border-box;
  border: none;
  outline: none;
  border-bottom: 1px solid #333333;
  background-color: transparent;
  font-size: 12px;
}
dropdown-js .drop-container {
  box-sizing: border-box;
  position: absolute;
  width: 120px;
  min-width: 10px;
  background-color: #ffffff;
  border: 0px solid #333333;
  z-index: 1;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
}
.drop-options-container {
  width: 100%;
  max-height: 200px;
  overflow-x: auto;
}
dropdown-js option {
  width: 100%;
  box-sizing: border-box;
  padding: 3px 5px;
  font-size: 12px;
  color: #333333;
  display: block;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}
dropdown-js option:hover {
  background-color: #eeeeee;
}
dropdown-js .selected {
  font-weight: bold;
}
dropdown-js .drop-container.open {
  border-width: 1px;
  max-height: 100vh;
}
`;
document.head.appendChild(style);