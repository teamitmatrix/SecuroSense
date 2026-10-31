/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                slate: {
                    850: '#1e293b',
                }
            },
        },
    },
    plugins: [],
}
