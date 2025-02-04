import Link from "@docusaurus/Link";
import clsx from "clsx";
import React from "react";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Gallery",
    description: (
      <>
        Find inspiration in the gallery of plotted art created by other users.
        <br />
        <Link to="/docs/category/gallery">Browse Now</Link>
      </>
    ),
  },
  {
    title: "Documentation",
    description: (
      <>
        Learn everything you need to know to take full advantage of the library.{" "}
        <br />
        <Link to="/docs/category/documentation">Learn Now</Link>
      </>
    ),
  },
];

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx("col col--6")}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
