const webpack = require('webpack'); // 用于访问内置插件
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const uglify = require('uglifyjs-webpack-plugin');

const config = {
    entry: {
        main: './src/js/main.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                minimize: true,
                                sourceMap: true
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                sourceMap: true
                            }
                        },
                        {
                            loader: 'less-loader',
                            options: {
                                sourceMap: true
                            }
                        }
                    ]
                })
            },
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: 'image/',
                            name: '[name].[ext]?[hash]',
                            useRelativePath: true,
                            publicPath: '../image/'
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js', '.css', '.less']
    },
    devtool: 'inline-source-map',
    plugins: [
        new ExtractTextPlugin({
            filename: getPath => {
                return getPath('css/[name].css').replace('css/js', 'css');
            }
        }),
        new CleanWebpackPlugin(['dist'])
        // new uglify()
    ]
};

module.exports = config;
