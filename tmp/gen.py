import urllib.parse
animals = {
    'horse': ('🐴', 10),
    'sheep': ('🐑', 5),
    'cat': ('🐱', 5),
    'dog': ('🐶', 5),
    'cow': ('🐮', 3),
    'rooster': ('🐓', 1),
    'hen': ('🐔', 1)
}
colors = ['#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#BBDEFB', '#B2EBF2', '#B2DFDB', '#C8E6C9', '#FFF9C4', '#FFE0B2', '#FFCCBC', '#D7CCC8', '#CFD8DC']

html = []
c_idx = 0
for name, (emoji, count) in animals.items():
    for _ in range(count):
        color = colors[c_idx % len(colors)]
        c_idx += 1
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="{color}" rx="50"/><text x="50" y="68" font-size="55" text-anchor="middle">{emoji}</text></svg>'
        encoded = 'data:image/svg+xml;utf8,' + urllib.parse.quote(svg)
        html.append(f'                        <img src="{encoded}" class="avatar-option" data-url="{encoded}">')

print('\n'.join(html))
