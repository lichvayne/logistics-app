export default function PageHeader({ title, subtitle, meta }) {
    return (
        <div className="page-header">
            <div>
                <h1 className="page-title">{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {meta && <div className="page-meta">{meta}</div>}
        </div>
    );
}
