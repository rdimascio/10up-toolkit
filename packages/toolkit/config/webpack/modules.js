const MiniCSSExtractPlugin = require('mini-css-extract-plugin');

const { hasBabelConfig, hasPostCSSConfig, fromConfigRoot } = require('../../utils');

const getCSSLoaders = ({ options, postcss, sass }) => {
	return [
		{
			loader: MiniCSSExtractPlugin.loader,
		},
		{
			loader: 'css-loader',
			options,
		},
		postcss && {
			loader: 'postcss-loader',
			options: {
				postcssOptions: {
					// Provide a fallback configuration if there's not
					// one explicitly available in the project.
					...(!hasPostCSSConfig() && {
						config: fromConfigRoot('postcss.config.js'),
					}),
				},
			},
		},
		sass && {
			loader: 'sass-loader',
			options: {
				sourceMap: options ? options.sourceMap : false,
			},
		},
	].filter(Boolean);
};

module.exports = ({ isProduction, isPackage, defaultTargets, projectConfig: { wordpress } }) => {
	return {
		rules: [
			{
				// Match all js/jsx/ts/tsx files except TS definition files
				test: /^(?!.*\.d\.tsx?$).*\.[tj]sx?$/,
				exclude: /node_modules\/(?!(@10up\/block-components)\/).*/,
				use: [
					require.resolve('../../compiled/thread-loader'),
					{
						loader: 'babel-loader',
						options: {
							// Babel uses a directory within local node_modules
							// by default. Use the environment variable option
							// to enable more persistent caching.
							cacheDirectory: process.env.BABEL_CACHE_DIRECTORY || true,

							// Provide a fallback configuration if there's not
							// one explicitly available in the project.
							...(!hasBabelConfig() && {
								babelrc: false,
								configFile: false,
								sourceType: 'unambiguous',
								presets: [
									[
										require.resolve('@10up/babel-preset-default'),
										{
											wordpress,
											useBuiltIns: isPackage ? false : 'usage',
											targets: defaultTargets,
										},
									],
								],
							}),
						},
					},
				],
			},
			{
				test: /\.svg$/,
				use: ['@svgr/webpack', 'url-loader'],
			},
			{
				test: /\.css$/,
				use: getCSSLoaders({
					options: {
						sourceMap: !isProduction,
						url: isPackage,
					},
					postcss: true,
					sass: false,
				}),
				exclude: /\.module\.css$/,
			},
			{
				test: /\.(sc|sa)ss$/,
				use: [
					...getCSSLoaders({
						options: {
							sourceMap: !isProduction,
							url: isPackage,
						},
						postcss: false,
						sass: true,
					}),
				],
				exclude: /\.module\.css$/,
			},
			{
				test: /\.module\.css$/,
				use: [
					...getCSSLoaders({
						options: {
							sourceMap: !isProduction,
							url: isPackage,
							import: false,
							modules: true,
						},
						postcss: true,
						sass: true,
					}),
				],
			},
			// when in package module only include referenced resources
			isPackage && {
				test: /\.(woff(2)?|ttf|eot|svg|jpg|jpeg|png|giff|webp)(\?v=\d+\.\d+\.\d+)?$/,
				type: 'asset/resource',
			},
		].filter(Boolean),
	};
};
