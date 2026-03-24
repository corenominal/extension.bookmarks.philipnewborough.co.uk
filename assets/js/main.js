// Vars used through site
const spinner = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

// Notifications
// Example usage: notify_send('Test Notification', 'This is a test, there is nothing to see here, please move along.', 'success', 5);
// Notes:
// * delay is optional, set to 0 to keep until dismissed
// * colors as defined by bootstrap
function notify_send(title = 'Title', msg = 'Nothing to see here.', color = 'dark', delay = 5){
    const existing = document.getElementById('notify-toast-container');
    if(existing) existing.remove();

    const html = `<div id="notify-toast-container" class="toast-container position-fixed top-0 end-0 p-3">
        <div class="toast align-items-center border-${color}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body"><strong>${encodeHTML(title)}</strong> ${encodeHTML(msg)}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    const toastEl = document.querySelector('#notify-toast-container .toast');
    new bootstrap.Toast(toastEl, { autohide: delay > 0, delay: delay * 1000 }).show();
}

// Test URL already exists?
async function test_url(){
    // Create payload
    const urlEl = document.getElementById('url');
    const apikeyEl = document.getElementById('apikey');
    const userUuidEl = document.getElementById('user_uuid');
    const data = { url: (urlEl && urlEl.value || '').trim() };
    const apikey = (apikeyEl && apikeyEl.value) ? apikeyEl.value.trim() : '';
    const userUuid = (userUuidEl && userUuidEl.value) ? userUuidEl.value.trim() : '';

    try{
        const params = new URLSearchParams({ url: data.url });
        const resp = await fetch(`https://bookmarks.philipnewborough.co.uk/api/bookmarks/check-url?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apikey,
                'user-uuid': userUuid
            }
        });
        if(!resp.ok) throw new Error('Network response was not ok');
        const json = await resp.json();
        if(json.exists){
            notify_send('Error!', 'Bookmark/URL already exists! Closing ...', 'danger', 3);
            setTimeout(() => { window.close(); }, 3000);
        }
    } catch(e){
        notify_send('Error!', 'Error communicating with server. Try again later.', 'danger', 3);
    }
}

// Small helper to escape text when inserting into HTML
function encodeHTML(str){
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Tags helpers (vanilla JS conversion of assets/js/tags.js)
function count_tags(){
    const els = document.querySelectorAll('#tags-list .tag');
    return els ? els.length : 0;
}

function get_tags(){
    if(count_tags() > 0){
        const tags = [];
        document.querySelectorAll('#tags-list .tag').forEach(function(el){
            tags.push(el.textContent.trim());
        });
        return tags;
    }
    return [];
}

function do_existing_tag(tag){
    const html = `<li data-tag="${encodeHTML(tag)}">
            <button type="button" class="btn btn-outline-secondary">
                <span class="tag">${encodeHTML(tag)}</span> <span class="badge bg-secondary">+</span>
            </button>
        </li>`;
    const list = document.getElementById('existing-tags-list');
    if(list) list.insertAdjacentHTML('beforeend', html);
    const datalist = document.getElementById('datalist-tags');
    if(datalist){
        const option = document.createElement('option');
        option.value = tag;
        datalist.appendChild(option);
    }
}

function get_existing_tags(){
    const apikeyEl = document.getElementById('apikey');
    const userUuidEl = document.getElementById('user_uuid');
    const apikey = apikeyEl ? apikeyEl.value.trim() : '';
    const userUuid = userUuidEl ? userUuidEl.value.trim() : '';
    fetch('https://bookmarks.philipnewborough.co.uk/api/tags', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'apikey': apikey,
            'user-uuid': userUuid
        }
    }).then(function(resp){
        if(!resp.ok) throw new Error('Network response was not ok');
        return resp.json();
    }).then(function(data){
        const trigger = document.getElementById('existing-tags-trigger');
        if(!data.tags || data.tags.length === 0){
            if(trigger) trigger.style.display = 'none';
        } else {
            data.tags.forEach(function(tag){ do_existing_tag(tag); });
        }
    }).catch(function(){
        // ignore errors silently (matching previous behaviour)
    });
}

document.addEventListener('DOMContentLoaded', function(){
    // Set the URL and title from local storage
    chrome.storage.local.get(['bm_title']).then((result) => {
        const t = document.getElementById('title');
        if(t) t.value = result.bm_title || '';
    });
    chrome.storage.local.get(['bm_url']).then((result) => {
        const u = document.getElementById('url');
        if(u) u.value = result.bm_url || '';
    });

    // Get the API key and user UUID from local storage and test
    chrome.storage.local.get(['apikey', 'user_uuid']).then((result) => {
        const settings = document.getElementById('settings');
        const bookmarkform = document.getElementById('bookmarkform');
        const apikeyEl = document.getElementById('apikey');
        const userUuidEl = document.getElementById('user_uuid');
        if(!result.apikey || !result.user_uuid){
            if(settings) settings.className = 'd-block';
            if(bookmarkform) bookmarkform.className = 'd-none';
        } else {
            if(apikeyEl) apikeyEl.value = result.apikey;
            if(userUuidEl && result.user_uuid) userUuidEl.value = result.user_uuid;
            // Get existing tags
            if(typeof get_existing_tags === 'function') get_existing_tags();
            // Test URL doesn't already exist in db
            test_url();
        }
    });

    // Set the API key
    const btnSaveApikey = document.getElementById('btn-save-apikey');
    if(btnSaveApikey){
        btnSaveApikey.addEventListener('click', function(event){
            event.preventDefault();
            const apikey = (document.getElementById('apikey') && document.getElementById('apikey').value) ? document.getElementById('apikey').value.trim() : '';
            const userUuid = (document.getElementById('user_uuid') && document.getElementById('user_uuid').value) ? document.getElementById('user_uuid').value.trim() : '';
            if(!userUuid){
                notify_send('Error!', 'User UUID is required.', 'danger', 3);
                return;
            }
            if(!apikey){
                notify_send('Error!', 'API Key is required.', 'danger', 3);
                return;
            }
            chrome.storage.local.set({apikey: apikey, user_uuid: userUuid}).then(() => {
                // Notify user
                notify_send('Settings Saved!', 'Settings saved successfully. Happy Bookmarking!', 'success', 2);
                // Change view
                const settings = document.getElementById('settings');
                const bookmarkform = document.getElementById('bookmarkform');
                if(settings) settings.className = 'd-none';
                if(bookmarkform) bookmarkform.className = 'd-block';
            });
        });
    }

    // Close extension window
    const btnClose = document.getElementById('btn-close');
    if(btnClose){
        btnClose.addEventListener('click', function(event){
            event.preventDefault();
            window.close();
        });
    }

    // Show settings
    const btnSettings = document.getElementById('btn-settings');
    if(btnSettings){
        btnSettings.addEventListener('click', function(event){
            const settings = document.getElementById('settings');
            const bookmarkform = document.getElementById('bookmarkform');
            if(!settings || !bookmarkform) return;
            if(settings.classList.contains('d-none')){
                settings.className = 'd-block';
                bookmarkform.className = 'd-none';
            } else {
                settings.className = 'd-none';
                bookmarkform.className = 'd-block';
            }
        });
    }

    // Save the bookmark
    const btnSaveBookmark = document.getElementById('btn-save-bookmark');
    if(btnSaveBookmark){
        btnSaveBookmark.addEventListener('click', async function(event){
            event.preventDefault();
            // Tags are required
            if(typeof count_tags === 'function' && count_tags() === 0){
                notify_send('Error!', 'No tags provided.', 'danger', 2);
                return;
            }
            // Test the title
            const titleEl = document.getElementById('title');
            if(!titleEl || titleEl.value === ''){
                notify_send('Error!', 'No title provided.', 'danger', 2);
                return;
            }
            // Test the url
            const urlEl = document.getElementById('url');
            if(!urlEl || urlEl.value === ''){
                notify_send('Error!', 'No URL provided.', 'danger', 2);
                return;
            }
            // Get Private value
            let isprivate = 0;
            const privateEl = document.getElementById('private');
            if(privateEl && privateEl.checked) isprivate = 1;
            // Get Dashboard value
            let isdashboard = 0;
            const dashboardEl = document.getElementById('dashboard');
            if(dashboardEl && dashboardEl.checked) isdashboard = 1;
            // Create payload
            const data = {
                title: titleEl.value.trim(),
                url: urlEl.value.trim(),
                notes: (document.getElementById('notes') && document.getElementById('notes').value) ? document.getElementById('notes').value.trim() : '',
                tags: (typeof get_tags === 'function') ? get_tags().join(',') : '',
                private: isprivate,
                dashboard: isdashboard,
            };
            // Provide some user feedback
            const btn = event.currentTarget;
            const btn_html = btn.innerHTML;
            btn.setAttribute('disabled', 'disabled');
            btn.innerHTML = spinner + ' Saving ...';

            // Post the bookmark
            try{
                const apikey = (document.getElementById('apikey') && document.getElementById('apikey').value) ? document.getElementById('apikey').value.trim() : '';
                const userUuid = (document.getElementById('user_uuid') && document.getElementById('user_uuid').value) ? document.getElementById('user_uuid').value.trim() : '';
                const resp = await fetch('https://bookmarks.philipnewborough.co.uk/api/bookmarks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': apikey,
                        'user-uuid': userUuid
                    },
                    body: JSON.stringify(data)
                });
                if(resp.status === 422){
                    const json = await resp.json();
                    const errorMsg = json.errors ? Object.values(json.errors).flat().join(' ') : 'Validation failed.';
                    notify_send('Error!', errorMsg, 'danger', 3);
                    btn.removeAttribute('disabled');
                    btn.innerHTML = btn_html;
                } else if(!resp.ok){
                    throw new Error('Network response was not ok');
                } else {
                    const bookmarkform = document.getElementById('bookmarkform');
                    if(bookmarkform) bookmarkform.innerHTML = '<p>Bookmark saved successfully!</p>';
                    setTimeout(() => { window.close(); }, 2000);
                }
            } catch(e){
                notify_send('Error!', 'Error communicating with server. Try again later.', 'danger', 3);
                btn.removeAttribute('disabled');
                btn.innerHTML = btn_html;
            }
        });
    }

    // --- Tags UI bindings (converted from jQuery) ---
    // Ensure tags count is computed
    count_tags();

    // Add tags via form submit
    const tagsForm = document.getElementById('tags-form');
    const tagsInput = document.getElementById('tags-input');
    if(tagsForm && tagsInput){
        tagsForm.addEventListener('submit', function(event){
            event.preventDefault();

            let tags = (tagsInput.value || '').trim();
            if(tags === ''){ tagsInput.value = ''; tagsInput.focus(); return; }

            tags = tags.split(',');

            // Clean/trim tags
            let tmp = [];
            tags.forEach(function(tag){
                tag = tag.toLowerCase().trim();
                tag = tag.replace(/\s+/g, '');
                if(tag !== '') tmp.push(tag);
            });
            tags = tmp;

            // Sanitize
            tmp = [];
            tags.forEach(function(tag){
                tag = tag.replace(/[^a-z0-9 -]/gi, '');
                tmp.push(tag);
            });
            tags = tmp;

            // Remove duplicates
            tags = tags.filter(function(item, pos){ return tags.indexOf(item) === pos; });

            // Remove tags that already exist in list
            if(count_tags() > 0){
                const existing = get_tags();
                tmp = [];
                tags.forEach(function(tag){ if(existing.indexOf(tag) === -1) tmp.push(tag); });
                tags = tmp;
            }

            // Append tags to list
            tags.forEach(function(tag){
                const tag_html = '<li>' +
                    '<button type="button" class="btn btn-outline-primary">' +
                    '<span class="tag">' + tag + '</span> <span class="badge bg-primary">×</span>' +
                    '</button>' +
                    '</li> ';
                const tagsList = document.getElementById('tags-list');
                if(tagsList) tagsList.insertAdjacentHTML('beforeend', tag_html);
            });

            count_tags();
            tagsInput.value = '';
            tagsInput.focus();
        });

        // Keyup: detect comma and submit
        tagsInput.addEventListener('keyup', function(){
            const v = this.value.trim();
            if(v.includes(',')){
                if(typeof tagsForm.requestSubmit === 'function') tagsForm.requestSubmit();
                else tagsForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
        });
    }

    // Remove tag when clicking on a tag list item
    const tagsListContainer = document.getElementById('tags-list');
    if(tagsListContainer){
        tagsListContainer.addEventListener('click', function(e){
            const li = e.target.closest('li');
            if(li && this.contains(li)){
                li.remove();
                count_tags();
            }
        });
    }

    // Add existing tag when clicking in the existing tags list
    const existingTagsList = document.getElementById('existing-tags-list');
    if(existingTagsList && tagsForm){
        existingTagsList.addEventListener('click', function(e){
            const li = e.target.closest('li');
            if(!li) return;
            const tag = li.getAttribute('data-tag');
            if(!tag) return;
            if(tagsInput) tagsInput.value = tag;
            if(typeof tagsForm.requestSubmit === 'function') tagsForm.requestSubmit();
            else tagsForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
    }

    // If existing tags loader exists, load them earlier when API key is set in storage code above
});