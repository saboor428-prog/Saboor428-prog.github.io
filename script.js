// ==========================================
// 1. MOBILE MENU TOGGLE
// ==========================================
const menuToggle = document.getElementById("menuToggle");
const navbar = document.getElementById("navbar");

if (menuToggle && navbar) {
    menuToggle.addEventListener("click", function () {
        navbar.classList.toggle("active");
    });
}

// Close mobile menu when link is clicked
document.querySelectorAll(".navbar a").forEach(link => {
    link.addEventListener("click", () => {
        if (navbar && navbar.classList.contains("active")) {
            navbar.classList.remove("active");
        }
    });
});


// ==========================================
// 2. SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://nerofazmyncxnmrsrkjr.supabase.co'; 
// Fixed JWT token starting with small 'e'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcm9mYXpteW5jeG5tcnNya2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1Njc0ODYsImV4cCI6MjEwMjE0MzQ4Nn0.EP1N6Boz_sHjWB4_Kdnx4toC5Gr4r_Mid17S0_cq3aQ'; 

// Initialize Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exact case match for Supabase bucket: 'Gallery'
const BUCKET_NAME = 'Gallery';


// ==========================================
// 3. FETCH & DISPLAY GALLERY IMAGES
// ==========================================
async function loadGalleryImages(targetFolder = '') {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;

    galleryGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px;">
            <p style="font-size: 16px; color: #64748b;">Loading product gallery...</p>
        </div>
    `;

    try {
        const { data: files, error } = await supabaseClient
            .storage
            .from(BUCKET_NAME)
            .list(targetFolder, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' }
            });

        if (error) {
            console.error('Supabase Error:', error.message);
            galleryGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 30px;">
                    <p>Unable to load images. ${error.message}</p>
                </div>
            `;
            return;
        }

        // Filter system placeholders and folders
        const validFiles = files.filter(file => 
            file.name !== '.emptyFolderPlaceholder' && 
            file.id !== null
        );

        if (!validFiles || validFiles.length === 0) {
            galleryGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #64748b;">
                    <p>No product images found in this category.</p>
                </div>
            `;
            return;
        }

        galleryGrid.innerHTML = '';

        validFiles.forEach(file => {
            const filePath = targetFolder ? `${targetFolder}/${file.name}` : file.name;
            
            const { data: urlData } = supabaseClient
                .storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath);

            const card = document.createElement('div');
            card.className = 'gallery-item';
            
            const displayTitle = file.name
                .replace(/\.[^/.]+$/, "")
                .replace(/[-_]/g, " ");

            card.innerHTML = `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); cursor: pointer;" onclick="openImageModal('${urlData.publicUrl}', '${displayTitle}')">
                    <div style="width: 100%; height: 220px; overflow: hidden; background: #f8fafc;">
                        <img src="${urlData.publicUrl}" alt="${displayTitle}" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="lazy" />
                    </div>
                    <div style="padding: 12px 10px;">
                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b; text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${displayTitle}
                        </p>
                    </div>
                </div>
            `;

            galleryGrid.appendChild(card);
        });

    } catch (err) {
        console.error('Unexpected Error:', err);
        galleryGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 30px;">
                <p>An unexpected error occurred while fetching images.</p>
            </div>
        `;
    }
}


// ==========================================
// 4. CATEGORY FILTER FUNCTION
// ==========================================
function filterGallery(folderName) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }

    loadGalleryImages(folderName);
}


// ==========================================
// 5. IMAGE PREVIEW MODAL (POPUP)
// ==========================================
function openImageModal(imgUrl, imgTitle) {
    let modal = document.getElementById('imageModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; align-items: center;
            justify-content: center; z-index: 9999; padding: 20px; box-sizing: border-box;
        `;
        modal.onclick = () => modal.style.display = 'none';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="position: relative; max-width: 90%; max-height: 90%; background: #fff; border-radius: 8px; padding: 15px; text-align: center;" onclick="event.stopPropagation()">
            <span style="position: absolute; top: 5px; right: 12px; font-size: 28px; cursor: pointer; color: #333;" onclick="document.getElementById('imageModal').style.display='none'">&times;</span>
            <img src="${imgUrl}" alt="${imgTitle}" style="max-width: 100%; max-height: 75vh; border-radius: 6px; object-fit: contain;" />
            <h4 style="margin: 10px 0 0; font-size: 16px; color: #333;">${imgTitle}</h4>
        </div>
    `;

    modal.style.display = 'flex';
}


// ==========================================
// 6. INITIALIZATION ON PAGE LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadGalleryImages('');
});
