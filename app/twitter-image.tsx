import OpenGraphImage, {
  alt,
  contentType,
  size,
} from "./opengraph-image";

export { alt, contentType, size };

export default function TwitterImage() {
  return OpenGraphImage();
}
