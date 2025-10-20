export default {
    theme: {
        screens: {
            'sm': '400px',
            'md': '480px',
            'lg': '660px',
            'xl': '800px',
            '2xl': '992px',
        },
        extend: {
            colors: {
                primary: "#157A6E",
                accent: "#D7F560",
                green: {
                    light: "#499F68",
                    dark: "#12534C"
                },
                light: '#F3FCF7',
                midlight: "#E9F3ED",
                dark: "#131815",
                gray: "#999999",
                error: "#C24848",
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(to bottom, #D7F560, #157A6E)',
                'gradient-primary-horizontal': 'linear-gradient(to bottom, #499F68, #12534C)',
                'gradient-secondary': 'linear-gradient(to right, #157A6E, #D7F560)',
            }
        }
    }
}
