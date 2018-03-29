module.exports = {
    plugins: [
        require('autoprefixer')({
            browsers: ['last 20 versions'],
            cascade: true,
            remove: true
        }),
        require('postcss-pxtorem')({
            rootValue: 75,
            unitPrecision: 3,
            propList: ['*'],
            minPixelValue: 2
        })
    ]
};
