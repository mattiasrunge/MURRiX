
import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";

class MainDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
                    <link rel="stylesheet" href="/style.global.css" />
                    <link rel="shortcut icon" type="image/ico" href="/favicon.ico" />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default MainDocument;
