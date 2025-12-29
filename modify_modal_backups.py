import re

def modify_modal():
    file_path = r"h:\Backup\Zero-Coding\Antigravity\Dashboardtt\src\components\modals\SoundNotificationsSettingsModal.tsx"
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update imports
    if "import { BackupsTab } from '../settings/tabs'" not in content:
        # Check if we should add it to existing import from tabs
        if "from '../settings/tabs'" in content:
             content = re.sub(
                r"from '../settings/tabs'",
                r", BackupsTab } from '../settings/tabs'",
                content
            )
             # Fix definition if it was like { NotificationTab, ... }
             content = content.replace("Tab, BackupsTab", "Tab, BackupsTab") 
             # Just in case it was a specific list, let's just add it nicely
             # Actually, simpler is to just replace the import line completely if we can match it
             pass
    
    # Try to clean up imports specifically
    content = content.replace(
        "import { NotificationsTab, ProductivityTab, PersonalizationTab, FinanceTab } from '../settings/tabs'",
        "import { NotificationsTab, ProductivityTab, PersonalizationTab, FinanceTab, BackupsTab } from '../settings/tabs'"
    )

    # 2. Remove backup logic (state and handlers)
    # Remove state
    content = re.sub(
        r"\s+// Состояние для раздела Бэкапы[\s\S]*?const restoreBackupConfirm = useConfirmModal\(\)",
        "",
        content
    )
    
    # Remove handlers
    # loadBackups, handleCreateBackup, handleRestoreBackup, handleDeleteBackup
    # And their hooks usage
    
    # We can use regex to find the block "const loadBackups = ..." until "const handleCreateBackup = ..." etc.
    # But it's risky with regex multiline.
    # Let's remove specific blocks if possible or just comment them out/remove known lines.
    
    # Remove loadBackups
    content = re.sub(r"\s+const loadBackups = useCallback[\s\S]*?const loadBackupsRef = useRef[\s\S]*?loadBackupsRef.current = loadBackups", "", content)
    
    # Remove useLayoutEffect/useEffect for backups
    content = re.sub(r"\s+// Используем useLayoutEffect для синхронной загрузки бэкапов[\s\S]*?loadBackupsRef.current\(\)\s+[\s\S]*?\}, \[isOpen, activeTab\]\)", "", content)
    content = re.sub(r"\s+useEffect\(\(\) => \{\s+if \(isOpen && activeTab === 'backups'\) \{[\s\S]*?\}, \[isOpen, activeTab\]\)", "", content)

    # Remove handlers
    content = re.sub(r"\s+const handleCreateBackup = async \(\) => \{[\s\S]*?setIsCreating\(false\)\s+[\s\S]*?\}", "", content)
    content = re.sub(r"\s+const handleRestoreBackup = timestamp => \{[\s\S]*?\}\)", "", content)
    content = re.sub(r"\s+const handleDeleteBackup = timestamp => \{[\s\S]*?\}\)", "", content)

    # 3. Replace Render Content
    # We need to find {activeTab === 'backups' && ( ... )} and replace its content
    
    # This regex looks for the backups tab block
    # It starts with {activeTab === 'backups' && (
    # And ends with )}
    # Inside it has <> ... </>
    
    pattern = r"\{activeTab === 'backups' && \(\s+<>[\s\S]*?</>\s+\)\}"
    replacement = "{activeTab === 'backups' && (\n            <BackupsTab />\n          )}"
    
    content = re.sub(pattern, replacement, content)

    # Remove unused helpers if any (formatBackupDate, formatBackupRelativeTime) - Wait, where are they?
    # They were inside the render block inline? No, they were likely used in the map.
    # Ah, I don't see them defined as constants in the top scope in my previous view. They might have been imported or defined inside.
    # If they were imported, I should clean imports.
    # grep didn't find them so they were probably not defined in this file or I missed them.
    # Lines 1372: {formatBackupDate(backup.timestamp)}
    # If they are not defined in the file, where do they come from?
    # Maybe from a helper import?
    # Let's just remove the render block first. Usage will be gone.

    # 4. Remove unused imports
    # useCreateManualBackup, useRestoreFromBackup from store/useEntriesStore
    # backupManager from utils/backupManager
    
    # We can try to clean up imports if we are brave.
    # Let's verify what's left.
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    modify_modal()
