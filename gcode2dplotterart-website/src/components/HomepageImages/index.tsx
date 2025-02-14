import clsx from "clsx";
import React from "react";
import styles from "./styles.module.css";

import Example2 from "@site/static/img/gallery/2023-06-20_sine_waves/example1.jpg";
import Example1 from "@site/static/img/gallery/2023-07-15_bunch_of_lines/example1.jpg";
import Example3 from "@site/static/img/gallery/2023-10-05_roaming_rectangles/example1.jpg";
import Example4 from "@site/static/img/gallery/2023-11-15_image_lines/example1.jpg";
import Example6 from "@site/static/img/gallery/2023-11-24_josef_albers_homage/example1.jpg";
import Example5 from "@site/static/img/gallery/2023-11-25_Bubbles/example1.jpg";

function Image({ src }: { src: string }) {
  return (
    <div className={clsx("col col--12")}>
      <div className="text--center padding-horiz--md">
        <img style={{ maxHeight: "70vh", marginBottom: "2rem" }} src={src} />
      </div>
    </div>
  );
}

const imageList = [Example1, Example3, Example4, Example5, Example6, Example2];

export default function HomepageImages(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {imageList.map((image, idx) => (
            <Image key={idx} src={image} />
          ))}
        </div>
      </div>
    </section>
  );
}
