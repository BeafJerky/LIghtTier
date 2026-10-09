fn main() {
    let mut windows = tauri_build::WindowsAttributes::new();
    // NOTE: requireAdministrator 是必需的——应用通过 nssm.exe 管理 Windows 服务
    // （安装/卸载/启停服务），这些操作要求管理员权限。
    // 若后续改为按需提权（仅在调用 nssm 时通过 runas 提权），可降级为 asInvoker。
    windows = windows.app_manifest(
        r#"
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <dependency>
   <dependentAssembly>
    <assemblyIdentity
     type="win32"
     name="Microsoft.Windows.Common-Controls"
     version="6.0.0.0"
     processorArchitecture="*"
     publicKeyToken="6595b64144ccf1df"
     language="*"
    />
   </dependentAssembly>
  </dependency>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
   <security>
     <requestedPrivileges>
       <requestedExecutionLevel level="requireAdministrator" uiAccess="false" />
     </requestedPrivileges>
   </security>
  </trustInfo>
</assembly>
"#,
    );
    tauri_build::try_build(tauri_build::Attributes::new().windows_attributes(windows))
        .expect("failed to run build script");
    // tauri_build::build()
}
