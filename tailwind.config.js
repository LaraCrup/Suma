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
            fontFamily: {
                'montserrat': ['Montserrat Alternates', 'sans-serif'],
            },
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
                'gradient-primary-horizontal': 'linear-gradient(to right, #D7F560, #157A6E)',
                'gradient-secondary': 'linear-gradient(to right, #12534C, #499F68)',
            }
        }
    }
}
