# Pelico Supply - Purchase Order Book Prototype

A high-fidelity prototype of the **Pelico "Supply → Purchase Order Book"** page, built with React, TypeScript, Tailwind CSS, and TanStack Table.

## Features

- **Complex Data Table**: Professional supply chain data table with 377+ rows
- **Column Grouping**: Two-level header structure with logical column groups
- **Multi-Sort**: Shift+click to sort by multiple columns
- **Column Resizing**: Drag handles to resize columns
- **Filtering**: Per-column filtering with global search
- **Pagination**: Configurable page sizes (50, 100, 200, 500)
- **Row Selection**: Checkbox selection for individual and all rows
- **Responsive Design**: Adapts to different screen sizes (≥1440px, 1280-1440px, smaller screens)
- **Design System**: Token-based design system with CSS variables

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Table v8** - Powerful table library
- **Lucide React** - Icon library

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Input.tsx
│   │   ├── Tabs.tsx
│   │   ├── Badge.tsx
│   │   └── ...
│   ├── Sidebar.tsx      # Left navigation sidebar
│   └── PurchaseOrderBookPage.tsx  # Main page component
├── lib/
│   ├── columns.tsx      # Table column definitions
│   └── mockData.ts      # Mock data generator
├── styles/
│   └── tokens.ts        # Design system tokens
└── App.tsx
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Design System

The design system is defined in `src/styles/tokens.ts` and exposed via CSS variables in `src/index.css`. All components consume these tokens for consistent styling.

### Key Design Tokens

- **Colors**: Backgrounds, surfaces, borders, text, status colors, group header tints
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Consistent spacing scale
- **Shadows**: Elevation system
- **Z-Index**: Layering system

## Table Features

### Column Groups

- **Supply Event**: Escalation Level, Type, Event
- **Status**: OTD Status, Delivery status
- **Produced Part**: Escalation Level, Part Number, Part Name, Plant
- **General Information**: Open Quantity, Price, Inventory Value, Supplier
- **Timeline**: OTD Date, Delivery Date

### Special Columns

- **Sug. ac…** and **Invento…**: Green header tint
- **Sim. Qty** and **Sim. D**: Purple header tint

### Interactions

- **Sorting**: Click column headers to sort (Shift+click for multi-sort)
- **Resizing**: Drag column borders to resize
- **Filtering**: Use global search or column-specific filters
- **Selection**: Click checkboxes to select rows

## Responsive Behavior

- **≥1440px**: Full table visible with comfortable column widths
- **1280-1440px**: Tighter density, still readable
- **<1280px**: Horizontal scroll for table, header/tabs remain usable

## Mock Data

The app includes a realistic mock data generator (`src/lib/mockData.ts`) that creates:
- 377 rows of supply chain data
- Realistic suppliers, part names, prices, dates
- Varied statuses and escalation levels
- Enough variation for meaningful sorting and filtering

## Future Enhancements

- Column visibility toggle
- Advanced filtering UI (per-column filters)
- Export functionality
- Real-time data updates
- Keyboard shortcuts
- Accessibility improvements

## License

This is a prototype for demonstration purposes.
