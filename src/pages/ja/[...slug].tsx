// Catch-all route for /ja/**/*
// This file handles all Japanese locale routes
import { GetStaticPaths, GetStaticProps } from 'next';

// Re-export everything from the parent pages
export default function JaCatchAll() {
  return null; // This will be replaced by the actual page component
}

// This is a placeholder - actual routing is handled by I18nContext
export const getStaticPaths: GetStaticPaths = async () => {
  // For static export, we return empty paths
  // The actual routing is handled client-side
  return {
    paths: [],
    fallback: false
  };
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {}
  };
};
