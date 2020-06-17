const path = require('path'); 
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    /* I/O settings*/
    entry: './src/index.tsx',
    output: {
        filename: 'main.js', 
        path: path.resolve(__dirname, 'dist')
    }, 
    /* webpack-dev-server config */
    devServer: {
        contentBase: './dist', // where to serve the content
        compress: true, // enables file compression 'gzip'
        port: 8080,
        open: false, // set browser window opening upon server start, 
        quiet: false  // prevent 
    },
    devtool: 'inline-source-map', // track error down from inside the original files
    /* Loaders management*/
    module: {
        rules: [
            {
                test: /\.s?css$/, 
                use: ['style-loader', 'css-loader']
            }, 
            {
                test: /\.(jpe?g|svg|png|gif)$/, 
                use: 'file-loader'
            },
            {
                test: /\.tsx?$/,
                use: ['ts-loader', 'babel-loader'],
                exclude: '/node_modules/'
            },{
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ]
    }, 
    /* TypeScript handler */
    resolve: {
        extensions: ['.tsx', ".ts", ".js"]
    },
    plugins: [
        new HtmlWebpackPlugin({
          template: path.resolve(__dirname, 'dist', 'index.html')
        })
      ]
}