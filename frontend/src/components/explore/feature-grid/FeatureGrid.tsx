import {ArrowRight} from "lucide-react";
import {Link} from "react-router-dom";
import "@/components/explore/feature-grid/FeatureGrid.css";

export type FeatureItem = {
    id: string;
    href: string;
    title: string;
    description: string;
    imageSrc: string;
    credit?: string;
};

type FeatureGridProps = {
    items: FeatureItem[];
};

const isExternal = (href: string) => href.startsWith("http://") || href.startsWith("https://");

const FeatureRow = ({item}: {item: FeatureItem}) => {
    const body = (
        <>
            <img className="feature-list__image" src={item.imageSrc} alt="" />
            <span className="feature-list__copy">
                <h2 className="feature-list__title">{item.title}</h2>
                <p className="feature-list__description">{item.description}</p>
                {item.credit && <p className="feature-list__credit">{item.credit}</p>}
            </span>
            <ArrowRight className="feature-list__arrow" size={22} aria-hidden="true" />
        </>
    );

    if (isExternal(item.href)) {
        return (
            <a className="feature-list__link" href={item.href} target="_blank" rel="noopener noreferrer">
                {body}
            </a>
        );
    }

    return (
        <Link className="feature-list__link" to={item.href}>
            {body}
        </Link>
    );
};

const FeatureGrid = ({items}: FeatureGridProps) => {
    if (items.length === 0) {
        return null;
    }

    return (
        <ol className="feature-list">
            {items.map((item) => (
                <li key={item.id} className="feature-list__item">
                    <FeatureRow item={item} />
                </li>
            ))}
        </ol>
    );
};

export default FeatureGrid;
