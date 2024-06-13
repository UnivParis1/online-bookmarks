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

var components = {};
var directives = {};

// usage <textarea-with-paste :toadd="a.toadd" v-model="a.a" add-with-space></textarea-with-paste>
components['textarea-with-paste'] = {
  model: { prop: 'modelValue', event: 'update:modelValue' },
  template: "<textarea ref='input' :value='modelValue' @input='tellParent'></textarea>",
  props: ['modelValue', 'toadd', 'addWithSpace'],
  watch: { 'toadd': function (toadd) {
      var element = this.$refs.input;
      insertAtCursor(element, toadd[0], this.addWithSpace === '' || this.addWithSpace === 'true');
      this.tellParent();
  } },
  methods: { tellParent: function () { 
      this.$emit("update:modelValue", this.$refs.input.value);
  } },
};

// emits 'change' event
components['input-text-file'] = {
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
};

directives['auto-focus'] = {
    inserted(el) {
        el.focus();
    }
};

function copyToClipboard(bookmark) {
    navigator.clipboard.writeText(publicUrlPrefix + bookmark.name).then(_ => {
        bookmark.warn_copied = true
        setTimeout(_ => bookmark.warn_copied = false, 1000)
    })
}

components['edit-bookmark'] = {
    template: '#edit-bookmark',
    props: ['bookmark', 'tags', 'full'],
    emits: ['submit'],
    computed: {
        publicUrlPrefix: () => publicUrlPrefix,
    },
    components: components,
    directives: directives,
    methods: {
        copyToClipboard,
        externalQrcodeEncoder,
    },
}

