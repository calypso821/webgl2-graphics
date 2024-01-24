import os

# Set the directory path containing your texture images
#directory = r"D:\OneDrive - Univerza v Ljubljani\GameDev\WebGL\projects\rg_webgl2_game\common\assets\scenes\scene1"
#directory = r"D:\OneDrive - Univerza v Ljubljani\GameDev\WebGL\projects\rg_webgl2_game\common\assets\scenes\scene2"
#directory = r"D:\OneDrive - Univerza v Ljubljani\GameDev\WebGL\projects\rg_webgl2_game\common\assets\models\monsters"
#directory = r"D:\OneDrive - Univerza v Ljubljani\GameDev\WebGL\projects\rg_webgl2_game\common\assets\models\opponents"
directory = r"D:\OneDrive - Univerza v Ljubljani\GameDev\WebGL\projects\rg_webgl2_game\common\assets\models\structures"
#directory = r"D:\OneDrive - Univerza v Ljubljani\GameDev\WebGL\projects\rg_webgl2_game\common\assets\models\weapons"
#directory = r"D:\OneDrive - Univerza v Ljubljani\GameDev\WebGL\projects\rg_webgl2_game\common\assets\scenes"

# Set the desired dimensions
new_width = 512
new_height = 512

# Loop through each file in the directory
for filename in os.listdir(directory):
    if filename.endswith(".png") or filename.endswith(".jpg"):
        file_path = os.path.join(directory, filename)
        
        # Open the image
        img = pdb.gimp_file_load(file_path, file_path)
        drawable = pdb.gimp_image_active_drawable(img)
        
        # Resize the image
        pdb.gimp_image_scale(img, new_width, new_height)
        
        # Save the image (optional)
        pdb.gimp_file_save(img, drawable, file_path, file_path)
        
        # Close the image
        pdb.gimp_image_delete(img)
