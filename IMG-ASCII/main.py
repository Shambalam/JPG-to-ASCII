from PIL import Image, ImageDraw, ImageFont

# Ordered from darkest to lightest (customizable)
ASCII_CHARS = "@#MW&%8B$QX0*AKHDNROZEPUGbdpqwm69aeoyCLVTIJY3457?+=<>|/\\{}[]()!ruxzncs1jtvli~^\"_`'. "

# === CONFIG ===
IMAGE_PATH = "Mona.jpg"
SCALE = 1.5  # >1 for more detail, <1 for less
FONT_PATH = "C:/Windows/Fonts/consola.ttf"
FONT_SIZE = 10
CHAR_ASPECT_RATIO = 0.55  # Compensates for character height vs width

def pixel_to_ascii(r, g, b, charset):
    gray = int((r + g + b) / 3)
    index = gray * (len(charset) - 1) // 255
    return charset[index]

def image_to_ascii(image, scale=1.0, charset=ASCII_CHARS, aspect_ratio=0.55):
    original_width, original_height = image.size
    new_width = int(original_width * scale)
    new_height = int(original_height * scale * aspect_ratio)
    resized = image.resize((new_width, new_height)).convert("RGB")

    ascii_lines = []
    for y in range(new_height):
        line = ""
        for x in range(new_width):
            r, g, b = resized.getpixel((x, y))
            line += pixel_to_ascii(r, g, b, charset)
        ascii_lines.append(line)
    return ascii_lines

def render_ascii_to_image(ascii_lines, font_path=FONT_PATH, font_size=10):
    font = ImageFont.truetype(font_path, font_size)
    bbox = font.getbbox("A")
    char_width = bbox[2] - bbox[0]
    char_height = bbox[3] - bbox[1]

    img_width = char_width * len(ascii_lines[0])
    img_height = char_height * len(ascii_lines)

    image = Image.new("RGB", (img_width, img_height), color="white")
    draw = ImageDraw.Draw(image)

    for i, line in enumerate(ascii_lines):
        draw.text((0, i * char_height), line, fill="black", font=font)

    return image

def main():
    original = Image.open(IMAGE_PATH)
    ascii_lines = image_to_ascii(original, scale=SCALE, charset=ASCII_CHARS, aspect_ratio=CHAR_ASPECT_RATIO)
    ascii_image = render_ascii_to_image(ascii_lines, font_path=FONT_PATH, font_size=FONT_SIZE)

    # Resize original to match ASCII image height
    target_height = ascii_image.height
    resized_original = original.resize(
        (int(original.width * (target_height / original.height)), target_height)
    )

    # Combine side-by-side
    combined = Image.new("RGB", (resized_original.width + ascii_image.width, target_height), color="white")
    combined.paste(resized_original, (0, 0))
    combined.paste(ascii_image, (resized_original.width, 0))

    combined.show()
    # combined.save("Mona_ASCII_SideBySide.png")

if __name__ == "__main__":
    main()
