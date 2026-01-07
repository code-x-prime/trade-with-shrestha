# Rich Text Editor Setup

## Installation

First, install the required package:

```bash
cd client
npm install jodit-react
```

## Usage

### Basic Usage

```jsx
import RichTextEditor from '@/components/RichTextEditor';
import { useState } from 'react';

export default function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Enter description..."
    />
  );
}
```

### With Form

```jsx
import RichTextEditor from '@/components/RichTextEditor';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function CourseForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // formData.description contains the HTML content
    console.log('Description HTML:', formData.description);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Course Title"
      />
      
      <RichTextEditor
        value={formData.description}
        onChange={(value) => setFormData({ ...formData, description: value })}
        placeholder="Enter course description..."
        height={400}
      />
      
      <Button type="submit">Save</Button>
    </form>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | The HTML content value |
| `onChange` | `(value: string) => void` | - | Callback when content changes |
| `placeholder` | `string` | `'Start typing...'` | Placeholder text |
| `height` | `number` | `400` | Editor height in pixels |
| `minHeight` | `number` | `300` | Minimum editor height |
| `maxHeight` | `number` | `800` | Maximum editor height |
| `className` | `string` | - | Additional CSS classes |
| `readonly` | `boolean` | `false` | Make editor readonly |

### Features

- ✅ Full WYSIWYG editor
- ✅ Image upload support
- ✅ Link insertion
- ✅ Text formatting (bold, italic, underline)
- ✅ Lists (ordered and unordered)
- ✅ Alignment options
- ✅ Undo/Redo
- ✅ Character and word counter
- ✅ Responsive design
- ✅ Matches brand colors
- ✅ No typing issues - proper state management

### Notes

- The editor returns HTML content, so store it as HTML in your database
- When displaying saved content, use `dangerouslySetInnerHTML` or a sanitizer
- The editor is dynamically imported to avoid SSR issues
- All styling matches your brand design (`#5C64D7`)

