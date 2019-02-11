'use strict';

function insertAtCursor(elt, myValue, withSpace) {
    if (!elt.selectionStart && elt.selectionStart != '0') return;

    var startPos = elt.selectionStart;
    var endPos = elt.selectionEnd;
    var before = elt.value.substring(0, startPos);
    var after = elt.value.substring(endPos, elt.value.length)
    if (withSpace) {
      if (before.match(/\S$/)) myValue = " " + myValue;
      if (after.match(/^\S/)) myValue = myValue + " ";
    }

    elt.value = before + myValue + after;
    elt.selectionStart = startPos + myValue.length;
    elt.selectionEnd = startPos + myValue.length;
    elt.focus();
}

// usage <textarea-with-paste :toadd="a.toadd" v-model="a.a" add-with-space></textarea-with-paste>
Vue.component('textarea-with-paste', {
  template: "<textarea ref='input' :value='value' @input='tellParent'></textarea>",
  props: ['value', 'toadd', 'addWithSpace'],
  watch: { 'toadd': function (toadd) {
      var element = this.$refs.input;
      insertAtCursor(element, toadd[0], this.addWithSpace === '' || this.addWithSpace === 'true');
      this.tellParent();
  } },
  methods: { tellParent: function () { 
      this.$emit("input", this.$refs.input.value);
  } },
});

// emits 'change' event
Vue.component('input-text-file', {
    template: "<input @change='read' style='display: none;' type='file'>",
    methods: {
        read: function (e) {
            var vm = this;
                var fileReader = new window.FileReader();

                fileReader.onload = function () {
                    vm.$emit('change', fileReader.result);
                };                
                fileReader.readAsText(e.target.files[0]);
        },
    },
});

Vue.directive('auto-focus', {
    inserted(el) {
        el.focus();
    }
});
