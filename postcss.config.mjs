import postcssImport from 'postcss-import';

// Tailwind CSS v4 is handled by @tailwindcss/vite, so this PostCSS config
// no longer needs to load tailwindcss or its legacy nesting plugin.
export default {
    plugins: {
        'postcss-import': postcssImport,          // to combine multiple css files
    }
};
