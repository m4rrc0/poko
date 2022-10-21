import { h } from 'preact';
// import React from 'react'
// const h = React.createElement;

const Anon = ({ tag, children, ...props }) => {
	return typeof tag === 'string' && (children || Object.keys(props).length)
		? h(tag, props, children)
		: null;
};

export default Anon;
