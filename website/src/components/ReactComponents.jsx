import { h } from 'preact'
// import React from 'react'
// import * as Preact from 'preact';
// import React, { useState, useEffect } from "react";
// import { getImage } from "@astrojs/image";

export const components = {
  // img: (props) => {
  //   const [imgProps, setImgProps] = useState({});
  //   useEffect(() => {
  //     getImg();
  //   });
  //   async function getImg() {
  //     const _imgProps = await getImage(props.src);
  //     console.log({ _imgProps });
  //     setImgProps(_imgProps);
  //   }
  //   return <img {...{ ...props, ...imgProps }} />;
  //   // return <img {...props} />;
  // },
  ChildPage: (props) => {
    // console.log({ props });
    return null;
  },
  Brand: ({ cap, link = false }) =>
    link ? (
      <a href="https://poko.m4rr.co/">
        <em>{cap ? "P" : "p"}oko</em>
      </a>
    ) : (
      <em>{cap ? "P" : "p"}oko</em>
    ),
  // wrapper: ({ children, components, ...props }) => {
  //   return null
  //   return (
  //   <>
  //   <components.Menu {...{ components, ...props }} />
  //   <components.main {...{ components, ...props }}>
  //   <components.header {...{ components, ...props }} >
  //   {props.title && <h1>{props.title}</h1>}
  //   </components.header>
  //   {children}
  //   </components.main>
  //   <components.footer />
  //   </>
  //   );
  //   }
};
