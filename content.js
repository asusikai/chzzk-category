// ✅ MutationObserver 기반 + DOM 파괴 없이 정렬만 수행하는 치지직 카테고리별 보기

function groupFollowingsByCategory(wrapper) {
    const listContainer = wrapper.querySelector('.navigator_list__cHnuV');
    if (!listContainer) return;

    const allItems = Array.from(listContainer.querySelectorAll('.navigator_item__qXlq9'));
    if (allItems.length === 0) return;

    const footer = listContainer.querySelector('.navigator_footer__7EbUV');
    const totalLiveCount = allItems.filter(item => item.querySelector('.navigator_is_live__jJiBO')).length;

    // 카테고리별 그룹화 (카테고리 없음/오프라인 구분)
    const grouped = {};
    allItems.forEach(item => {
        const isLive = !!item.querySelector('.navigator_is_live__jJiBO');
        const categoryText = item.querySelector('.navigator_category__S1wCR')?.innerText?.trim();

        let category;
        if (!categoryText && isLive) {
            category = '카테고리 없음';
        } else if (!isLive) {
            category = '오프라인';
        } else {
            category = categoryText || '카테고리 없음';
        }

        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(item);
    });

    // 그룹 정렬 순서: 오프라인 제외하고 라이브 수 기준 내림차순 정렬
    const sortedGroups = Object.entries(grouped).sort(([catA, listA], [catB, listB]) => {
        if (catA === '오프라인') return 1;
        if (catB === '오프라인') return -1;

        const liveA = listA.filter(item => item.querySelector('.navigator_is_live__jJiBO')).length;
        const liveB = listB.filter(item => item.querySelector('.navigator_is_live__jJiBO')).length;
        return liveB - liveA;
    });

    // 기존 헤더 제거
    listContainer.querySelectorAll('.chzzk-grouper-group-header').forEach(el => el.remove());

    // 정렬된 그룹 삽입
    sortedGroups.forEach(([category, itemList]) => {
        const categoryCount = itemList.length;
        const liveCount = itemList.filter(item => item.querySelector('.navigator_is_live__jJiBO')).length;

        const header = document.createElement('div');
        header.className = 'chzzk-grouper-group-header';

        const title = document.createElement('span');
        title.textContent = category === '오프라인'
            ? category
            : `${category} (${categoryCount}/${totalLiveCount})`;

        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('width', '22');
        icon.setAttribute('height', '22');
        icon.setAttribute('viewBox', '0 0 22 22');
        icon.setAttribute('fill', 'none');
        icon.setAttribute('class', 'chzzk-grouper-arrow-icon');
        icon.style.transform = 'rotate(180deg)';
        icon.style.transition = 'transform 0.2s ease';

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M7 9L11 13L15 9');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        icon.appendChild(path);

        header.appendChild(title);
        header.appendChild(icon);

        let isExpanded = true;
        header.addEventListener('click', () => {
            isExpanded = !isExpanded;
            icon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
            itemList.forEach(item => {
                item.style.display = isExpanded ? '' : 'none';
            });
        });

        listContainer.insertBefore(header, footer || null);
        itemList.forEach(item => {
            item.style.display = '';
            listContainer.insertBefore(item, footer || null);
        });
    });
}

function restoreFlatList(wrapper) {
    const listContainer = wrapper.querySelector('.navigator_list__cHnuV');
    if (!listContainer) return;

    const footer = listContainer.querySelector('.navigator_footer__7EbUV');
    const items = Array.from(listContainer.querySelectorAll('.navigator_item__qXlq9'));

    // 헤더 제거
    listContainer.querySelectorAll('.chzzk-grouper-group-header').forEach(el => el.remove());

    // 시청자 수 내림차순 정렬
    const sorted = items.sort((a, b) => {
        const aViewer = parseInt(a.querySelector('.navigator_count__db5Av')?.innerText?.replace(/[^\d]/g, '') || '0');
        const bViewer = parseInt(b.querySelector('.navigator_count__db5Av')?.innerText?.replace(/[^\d]/g, '') || '0');
        return bViewer - aViewer;
    });

    sorted.forEach(item => {
        item.style.display = '';
        listContainer.appendChild(item);
    });

    if (footer && footer !== listContainer.lastChild) {
        listContainer.appendChild(footer);
    }
}

function injectCategoryToggleButton(wrapper) {
    const headerElement = wrapper.querySelector('.navigator_header__inwmE');
    const titleElement = wrapper.querySelector('.navigator_title__9RhVJ');
    if (!headerElement || !titleElement) return;
    if (titleElement.innerText.trim() !== '팔로잉 채널') return;
    if (wrapper.querySelector('.chzzk-grouper-toggle-button')) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '카테고리별 보기';
    toggleBtn.classList.add('chzzk-grouper-toggle-button');

    let active = false;
    toggleBtn.addEventListener('click', () => {
        active = !active;
        toggleBtn.classList.toggle('active', active);

        if (active) {
            groupFollowingsByCategory(wrapper);
        } else {
            restoreFlatList(wrapper);
        }
    });

    headerElement.insertAdjacentElement('afterend', toggleBtn);
}

function observeAndSetupToggle() {
    const observer = new MutationObserver(() => {
        const wrappers = document.querySelectorAll('.navigator_wrapper__ruh6f');
        wrappers.forEach(wrapper => {
            const title = wrapper.querySelector('.navigator_title__9RhVJ');
            if (title?.innerText.trim() === '팔로잉 채널') {
                injectCategoryToggleButton(wrapper);
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

observeAndSetupToggle();
