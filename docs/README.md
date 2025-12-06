# CkEditableArray - Docs

This `docs` folder contains implementation and step-by-step TDD notes for the `ck-editable-array` Web Component.

### Quick Usage (data property)

```html
<ck-editable-array></ck-editable-array>
<script>
  const el = document.querySelector('ck-editable-array');
  el.data = [{ name: 'Alice', age: 30 }];
  // Mutating original array will not change component data
  // el.data returns a cloned array
</script>
```

See `docs/readme.technical.md` for implementation details.
