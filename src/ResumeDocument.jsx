import { Children } from "react";
import ReactMarkdown from "react-markdown";
import { Mail, MapPin, Phone, Star } from "lucide-react";
import { splitIconTokens } from "./iconTokens.js";

export function GithubIcon({ size, ...props }) {
  return (
    <svg
      {...props}
      height={size}
      width={size}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.28-.36 6.72-1.61 6.72-7A5.4 5.4 0 0 0 19.22 4 5 5 0 0 0 19.13.5S17.95.14 15 1.88a13.4 13.4 0 0 0-7 0C5.05.14 3.87.5 3.87.5A5 5 0 0 0 3.78 4a5.4 5.4 0 0 0-1.5 3.7c0 5.42 3.44 6.67 6.72 7C8.48 15.36 8 16.26 8 18v4" />
      <path d="M8 19c-3 .9-3-1.5-4-2" />
    </svg>
  );
}

export function LinkedinIcon({ size, ...props }) {
  return (
    <svg
      {...props}
      height={size}
      width={size}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" />
      <path d="M2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const ICONS = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  email: Mail,
  phone: Phone,
  location: MapPin,
  star: Star,
};

function renderIconTokens(children) {
  return Children.map(children, (child) => {
    if (typeof child !== "string") return child;

    return splitIconTokens(child).map((part, index) => {
      if (part.type === "text") return part.value;

      const Icon = ICONS[part.name];
      return (
        <Icon
          aria-hidden="true"
          className="resume-inline-icon"
          focusable="false"
          key={`${part.name}-${index}`}
        />
      );
    });
  });
}

function iconized(Tag) {
  return function IconizedElement({ node: _node, children, ...props }) {
    return <Tag {...props}>{renderIconTokens(children)}</Tag>;
  };
}

const markdownComponents = {
  h1: iconized("h1"),
  h2: iconized("h2"),
  h3: iconized("h3"),
  h4: iconized("h4"),
  h5: iconized("h5"),
  h6: iconized("h6"),
  p: iconized("p"),
  li: iconized("li"),
  strong: iconized("strong"),
  em: iconized("em"),
  a({ node: _node, children, ...props }) {
    return (
      <a {...props} rel="noreferrer" target="_blank">
        {renderIconTokens(children)}
      </a>
    );
  },
};

export default function ResumeDocument({ source, theme }) {
  return (
    <article
      aria-label="Resume preview"
      className="resume-page"
      data-resume-theme={theme}
    >
      <ReactMarkdown components={markdownComponents} skipHtml>
        {source}
      </ReactMarkdown>
    </article>
  );
}
